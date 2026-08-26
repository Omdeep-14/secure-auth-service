import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";
import crypto from "node:crypto";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const generateAccessToken = (userId: string) => {
  return new SignJWT({
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
};

export const verifyAccessToken = async (token: string) => {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }

  return payload;
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateCsrfToken = (): string => {
  const randomValue = crypto.randomBytes(32).toString("hex");

  const signature = crypto
    .createHmac("sha256", env.CSRF_SECRET)
    .update(randomValue)
    .digest("hex");

  return `${randomValue}.${signature}`;
};
