import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

import app from "../../src/app.ts";
import { pool } from "../../src/config/db.ts";
import { hashPassword } from "../../src/utils.ts/passHash.ts";

const testEmail = "logout-test@example.com";
const testPassword = "Strong1!";

describe("POST /api/auth/logout", () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      `,
      ["Logout Test User", testEmail, passwordHash],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);

    await pool.end();
  });

  it("should logout successfully without a refresh token", async () => {
    const csrfResponse = await request(app).get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);
    expect(csrfResponse.body.success).toBe(true);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    const response = await request(app)
      .post("/api/auth/logout")
      .set("x-csrf-token", csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");

    const cookies = response.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    const refreshCookie = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(refreshCookie).toContain("Path=/api/auth");
  });

  it("should logout successfully with a valid refresh token", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(201);

    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .set("x-csrf-token", csrfToken);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toBe("Logged out successfully");
  });

  it("should invalidate the refresh token after logout", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(201);

    // Get CSRF token before logout
    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    // Logout
    const logoutResponse = await agent
      .post("/api/auth/logout")
      .set("x-csrf-token", csrfToken);

    expect(logoutResponse.status).toBe(200);

    // Get a new CSRF token for the refresh request.
    // The refresh token cookie should now be gone.
    const newCsrfResponse = await agent.get("/api/auth/csrf");

    expect(newCsrfResponse.status).toBe(200);

    const newCsrfToken = newCsrfResponse.body.csrfToken;

    expect(newCsrfToken).toBeDefined();

    const refreshResponse = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", newCsrfToken);

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.success).toBe(false);
  });

  it("should clear the refresh token cookie", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResponse.status).toBe(201);

    const csrfResponse = await agent.get("/api/auth/csrf");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    expect(csrfToken).toBeDefined();

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .set("x-csrf-token", csrfToken);

    expect(logoutResponse.status).toBe(200);

    const cookies = logoutResponse.headers["set-cookie"] as unknown as string[];

    expect(cookies).toBeDefined();

    const refreshCookie = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();

    expect(refreshCookie).toContain("refreshToken=");
    expect(refreshCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(refreshCookie).toContain("Path=/api/auth");
  });
});
