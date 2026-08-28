import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

import app from "../../src/app.ts";
import { pool } from "../../src/config/db.ts";
import { hashPassword } from "../../src/utils.ts/passHash.ts";

const testEmail = "test@example.com";
const testPassword = "Strong1!";

describe("POST /api/auth/refresh", () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      `,
      ["Refresh Test User", testEmail, passwordHash],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);

    await pool.end();
  });

  // ---------------------------------------------------------
  // 1. Missing refresh token
  // ---------------------------------------------------------
  it("should reject when refresh token is missing", async () => {
    const agent = request.agent(app);

    // Get CSRF token
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);
    expect(csrfResponse.body.success).toBe(true);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    // No refresh token cookie
    const response = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrfToken);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Refresh token required");
  });

  // ---------------------------------------------------------
  // 2. Invalid refresh token
  // ---------------------------------------------------------
  it("should reject an invalid refresh token", async () => {
    const agent = request.agent(app);

    // Get CSRF token
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    const response = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrfToken)
      .set("Cookie", "refreshToken=invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // ---------------------------------------------------------
  // 3. Successful refresh
  // ---------------------------------------------------------
  it("should refresh successfully with a valid refresh token", async () => {
    const agent = request.agent(app);

    // Login to obtain refresh token cookie
    const loginResponse = await agent.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(201);

    // Get CSRF token using the SAME agent
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    // Refresh
    const response = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });

  // ---------------------------------------------------------
  // 4. Refresh token rotation
  // ---------------------------------------------------------
  it("should rotate the refresh token", async () => {
    const agent = request.agent(app);

    // Login
    const loginResponse = await agent.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(201);

    const oldCookies = loginResponse.headers["set-cookie"];

    expect(oldCookies).toBeDefined();

    // Get CSRF token
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    // Refresh
    const refreshResponse = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrfToken);

    expect(refreshResponse.status).toBe(200);

    const newCookies = refreshResponse.headers["set-cookie"];

    expect(newCookies).toBeDefined();

    // A new refresh token should be issued
    expect(newCookies).not.toEqual(oldCookies);
  });

  // ---------------------------------------------------------
  // 5. Expired refresh token
  // ---------------------------------------------------------
  it("should reject an expired refresh token", async () => {
    const agent = request.agent(app);

    // Get CSRF token
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    /*
     * This must be an ACTUAL expired JWT.
     *
     * Replace the value below with a token generated using
     * your application's refresh-token signing secret with
     * an expiration time in the past.
     */
    const expiredRefreshToken = "YOUR_EXPIRED_REFRESH_TOKEN";

    const response = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrfToken)
      .set("Cookie", `refreshToken=${expiredRefreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
