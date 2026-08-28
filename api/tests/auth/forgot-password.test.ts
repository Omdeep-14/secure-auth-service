import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../../src/app";
import { redis } from "../../src/config/redis";

const registeredEmail = "test@example.com";
const nonExistentEmail = "doesnotexist@example.com";

beforeEach(async () => {
  await redis.del(`rateLimit:forgotPassword:${registeredEmail}`);
  await redis.del(`rateLimit:forgotPassword:${nonExistentEmail}`);
});

describe("POST /api/auth/forgot-password", () => {
  it("should send OTP for a registered email", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({
      email: registeredEmail,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should return the same response for a non-existent email", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({
      email: nonExistentEmail,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should reject an invalid email", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({
      email: "invalid-email",
    });

    expect(response.status).toBe(400);
  });

  it("should reject when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(response.status).toBe(400);
  });

  it("should reject an empty email", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({
      email: "",
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/verify-forgot-password", () => {
  it("should reject an invalid OTP", async () => {
    const response = await request(app)
      .post("/api/auth/verify-forgot-password")
      .send({
        email: registeredEmail,
        otp: "000000",
        newPassword: "Valid@123",
      });

    expect(response.status).toBe(400);
  });

  it("should reject when OTP is missing", async () => {
    const response = await request(app)
      .post("/api/auth/verify-forgot-password")
      .send({
        email: registeredEmail,
        newPassword: "Valid@123",
      });

    expect(response.status).toBe(400);
  });

  it("should reject when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/verify-forgot-password")
      .send({
        otp: "123456",
        newPassword: "Valid@123",
      });

    expect(response.status).toBe(400);
  });

  it("should reject when new password is missing", async () => {
    const response = await request(app)
      .post("/api/auth/verify-forgot-password")
      .send({
        email: registeredEmail,
        otp: "123456",
      });

    expect(response.status).toBe(400);
  });

  it("should reject a weak new password", async () => {
    const response = await request(app)
      .post("/api/auth/verify-forgot-password")
      .send({
        email: registeredEmail,
        otp: "123456",
        newPassword: "weak",
      });

    expect(response.status).toBe(400);
  });
});
