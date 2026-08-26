import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils.ts/appError.js";
import { errors as joseErrors } from "jose";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof joseErrors.JWTExpired) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (err instanceof joseErrors.JOSEError) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
