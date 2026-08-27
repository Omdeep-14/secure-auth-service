import { redis } from "../config/redis.js";
import { AppError } from "./appError.js";

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowSeconds: number,
) => {
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (count > limit) {
    throw new AppError(429, "Too many requests, please try again later");
  }
};
