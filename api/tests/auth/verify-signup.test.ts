import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";

import app from "../../src/app.ts";
import { redis } from "../../src/config/redis.js";
import { pool } from "../../src/config/db.js";
import { sendOtpEmail } from "../../src/utils.ts/sendMail.js";

vi.mock("../../src/utils.ts/generateOtp.js", () => ({
  genOtp: () => "123456",
}));

vi.mock("../../src/utils.ts/sendEmail.js", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

//valid otp
describe("POST /api/auth/verify-signup", () => {
  it("should verify signup with a valid OTP", async () => {
    const email = `verify-${Date.now()}@example.com`;

    // First create signup session
    const signupResponse = await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Verify User ${Date.now()}`,
        email,
        password: "Strong1!",
      });

    expect(signupResponse.status).toBe(201);

    // Verify OTP
    const response = await request(app).post("/api/auth/verify-signup").send({
      email,
      otp: "123456",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Account verified successfully");
  });
});

//invalid otp test
describe("POST /api/auth/verify-signup", () => {
  it("should reject an invalid OTP", async () => {
    const email = `invalid-otp-${Date.now()}@example.com`;

    await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Invalid OTP ${Date.now()}`,
        email,
        password: "Strong1!",
      });

    const response = await request(app).post("/api/auth/verify-signup").send({
      email,
      otp: "999999",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid otp");
  });
});

//otp expired test
describe("POST /api/auth/verify-signup", () => {
  it("should reject when signup OTP has expired", async () => {
    const response = await request(app)
      .post("/api/auth/verify-signup")
      .send({
        email: `expired-${Date.now()}@example.com`,
        otp: "123456",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "OTP expired or sign up session not found",
    );
  });
});

//brute force otp
describe("POST /api/auth/verify-signup", () => {
  it("should block signup after too many invalid OTP attempts", async () => {
    const email = `attempts-${Date.now()}@example.com`;

    await request(app)
      .post("/api/auth/signup")
      .send({
        name: `Attempts User ${Date.now()}`,
        email,
        password: "Strong1!",
      });

    for (let i = 0; i < 5; i++) {
      const response = await request(app).post("/api/auth/verify-signup").send({
        email,
        otp: "000000",
      });

      expect(response.status).toBe(400);
    }

    const response = await request(app).post("/api/auth/verify-signup").send({
      email,
      otp: "000000",
    });

    expect(response.status).toBe(429);
  }, 15000);
});

//default role check
describe("POST /api/auth/verify-signup", () => {
  it("should assign the default user role after verification", async () => {
    const email = `role-${Date.now()}@example.com`;
    const name = `Role User ${Date.now()}`;

    await request(app).post("/api/auth/signup").send({
      name,
      email,
      password: "Strong1!",
    });

    const response = await request(app).post("/api/auth/verify-signup").send({
      email,
      otp: "123456",
    });

    expect(response.status).toBe(201);

    const result = await pool.query(
      `
    SELECT r.name
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE u.email = $1
    `,
      [email],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("user");
  });
});
