import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app.js";

describe("GET /api/auth/csrf", () => {
  it("should return a CSRF token", async () => {
    const response = await request(app).get("/api/auth/csrf");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.csrfToken).toBeDefined();
    expect(typeof response.body.csrfToken).toBe("string");
    expect(response.body.csrfToken.length).toBeGreaterThan(0);
  });

  it("should return a different CSRF token for different requests", async () => {
    const response1 = await request(app).get("/api/auth/csrf");

    const response2 = await request(app).get("/api/auth/csrf");

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    expect(response1.body.csrfToken).toBeDefined();
    expect(response2.body.csrfToken).toBeDefined();

    expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
  });
});
