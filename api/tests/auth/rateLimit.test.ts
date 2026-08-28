import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit } from "../../src/utils.ts/rateLimiter.js";

import { redis } from "../../src/config/redis.js";

describe("checkRateLimit", () => {
  const key = `test:rateLimit:${Date.now()}`;

  beforeEach(async () => {
    await redis.del(key);
  });

  it("should allow requests within the limit", async () => {
    await expect(checkRateLimit(key, 3, 60)).resolves.toBeUndefined();

    await expect(checkRateLimit(key, 3, 60)).resolves.toBeUndefined();

    await expect(checkRateLimit(key, 3, 60)).resolves.toBeUndefined();
  });

  it("should reject requests after the limit is exceeded", async () => {
    await checkRateLimit(key, 2, 60);
    await checkRateLimit(key, 2, 60);

    await expect(checkRateLimit(key, 2, 60)).rejects.toMatchObject({
      statusCode: 429,
      message: "Too many requests, please try again later",
    });
  });

  it("should allow the request exactly at the limit", async () => {
    await checkRateLimit(key, 3, 60);
    await checkRateLimit(key, 3, 60);

    await expect(checkRateLimit(key, 3, 60)).resolves.toBeUndefined();
  });

  it("should keep different keys independent", async () => {
    const key1 = `test:rateLimit:key1:${Date.now()}`;
    const key2 = `test:rateLimit:key2:${Date.now()}`;

    await checkRateLimit(key1, 1, 60);

    await expect(checkRateLimit(key1, 1, 60)).rejects.toMatchObject({
      statusCode: 429,
    });

    await expect(checkRateLimit(key2, 1, 60)).resolves.toBeUndefined();

    await redis.del(key1, key2);
  });

  it("should set an expiration on a new rate limit key", async () => {
    const expirationKey = `test:rateLimit:expiration:${Date.now()}`;

    await checkRateLimit(expirationKey, 5, 60);

    const ttl = await redis.ttl(expirationKey);

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);

    await redis.del(expirationKey);
  });
});
