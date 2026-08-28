import { type Request, type Response, type NextFunction } from "express";
import { checkRateLimit } from "../utils.ts/rateLimiter.js";
import { env } from "../config/env.js";

export const rateLimit = (limit: number, windowSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (env.NODE_ENV === "test") {
      return next();
    }
    const key = `rateLimit:${req.path}:${req.ip}`;

    await checkRateLimit(key, limit, windowSeconds);

    next();
  };
};
