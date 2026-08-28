import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";

import app from "../../src/app.ts";
import { pool } from "../../src/config/db.js";
import { hashPassword } from "../../src/utils.ts/passHash.js";

describe("POST /api/auth/login", () => {
  const email = `login-${Date.now()}@example.com`;
  const password = "Strong1!";

  beforeEach(async () => {
    // Make sure the test user exists
    const passwordHash = await hashPassword(password);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      `,
      ["Login Test User", email, passwordHash],
    );
  });

  // 1. Valid login
  it("should login successfully with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login success");

    expect(response.body.accessToken).toBeDefined();
    expect(typeof response.body.accessToken).toBe("string");

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  // 2. Wrong password
  it("should reject an incorrect password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password: "Wrong1  !",
    });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // 3. Non-existent email
  it("should reject a non-existent email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: `does-not-exist-${Date.now()}@example.com`,
        password,
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  // 4. Invalid email
  it("should reject an invalid email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password,
    });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  // 5. Invalid password
  it("should reject an invalid password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password: "weak",
    });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });
});

afterAll(async () => {
  await pool.end();
});
