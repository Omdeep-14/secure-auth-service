import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils.ts/appError.js";
import { verifyAccessToken } from "../utils.ts/tokens.js";

export const tokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer")) {
    throw new AppError(401, "unauthorized");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError(401, "unauthorized");
  }

  const payload = await verifyAccessToken(token);

  req.user = {
    id: payload.sub!,
  };

  next();
};
