import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { hashPassword } from "../../src/utils.ts/passHash.js";
import { afterEach } from "vitest";
import { redis } from "../../src/config/redis.js";

//clean up
afterEach(async () => {
  await redis.del("signup:test@example.com");
});

//to test endpoint is operational
describe("POST /api/auth/signup", () => {
  it("should send verification OTP for a valid signup", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "Test User",
      email: "test@example.com",
      password: "Gravity12@t",
    });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Vrification OTP sent to your email");
  });
});

//to test exisiting email gets rejected while sign up
describe("POST /api/auth/signup", () => {
  it("should reject an existing email", async () => {
    const email = `existing-${Date.now()}@example.com`;

    const passwordHash = await hashPassword("Strong1!");

    const name = `Existing User ${Date.now()}`;

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      `,
      [name, email, passwordHash],
    );

    const response = await request(app).post("/api/auth/signup").send({
      name: name,
      email,
      password: "Strrong1!",
    });

    expect(response.status).toBe(409);

    expect(response.body.message).toBe("User already exists");
  });
});

//invalid email
describe("POST /api/auth/signup", () => {
  it("should reject an invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Test User ${Date.now()}`,
        email: "not-an-email",
        password: "Strong1!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });
});

//invalid/weak password
describe("POST /api/auth/signup", () => {
  it("should reject an invalid password", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Test User ${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        password: "weak",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });
});

//Missing field
describe("POST /api/auth/signup", () => {
  it("should reject signup when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Test User ${Date.now()}`,
        password: "Strong1!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
