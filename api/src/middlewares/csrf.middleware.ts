import { type Request, type Response, type NextFunction } from "express";

import { AppError } from "../utils.ts/appError.js";

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader) {
    throw new AppError(403, "CSRF validation failed");
  }

  if (csrfCookie !== csrfHeader) {
    throw new AppError(403, "CSRF validation failed");
  }

  next();
};
