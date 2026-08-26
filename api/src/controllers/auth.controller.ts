import type { Request, Response } from "express";
import {
  signupSchema,
  verifySignupSchema,
  loginSchema,
} from "../schema/auth.schema.js";
import {
  signupService,
  verifySignupService,
  loginService,
  refreshTokenService,
} from "../service/auth.service.js";
import { env } from "../config/env.js";
import { AppError } from "../utils.ts/appError.js";
import { generateCsrfToken } from "../utils.ts/tokens.js";
import { success } from "zod";

export async function signupController(req: Request, res: Response) {
  const validBody = signupSchema.safeParse(req.body);

  if (!validBody.success) {
    throw validBody.error;
  }

  const { name, email, password } = validBody.data;

  await signupService({ name, email, password });

  return res.status(201).json({
    success: true,
    message: "Vrification OTP sent to your email",
  });
}

export const verifySignupController = async (req: Request, res: Response) => {
  const result = verifySignupSchema.safeParse(req.body);

  if (!result.success) {
    throw result.error;
  }

  const user = await verifySignupService(result.data);

  return res.status(201).json({
    success: true,
    message: "Account verified successfully",
    data: user,
  });
};

export const loginController = async (req: Request, res: Response) => {
  const validDetails = loginSchema.safeParse(req.body);

  if (!validDetails.success) {
    throw validDetails.error;
  }

  const { accessToken, refreshToken } = await loginService(validDetails.data);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "prod",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    message: "Login success",
    accessToken,
  });
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, "Refresh token required");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await refreshTokenService(refreshToken);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/auth",
  });

  return res.status(200).json({
    success: true,
    data: {
      accessToken,
    },
  });
};

export const csrfController = (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken();

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: false,
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  return res.status(200).json({
    success: true,
    csrfToken,
  });
};
