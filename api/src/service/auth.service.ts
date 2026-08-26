import {
  type signupSchemaType,
  type verifySignUpSchemaType,
  type loginSchemaType,
} from "../schema/auth.schema.js";
import { pool } from "../config/db.js";
import { AppError } from "../utils.ts/appError.js";
import { hashPassword, verifyPassword } from "../utils.ts/passHash.js";
import { redis } from "../config/redis.js";
import { sendOtpEmail } from "../utils.ts/sendMail.js";
import { genOtp } from "../utils.ts/generateOtp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils.ts/tokens.js";
import crypto from "node:crypto";

export const signupService = async ({
  name,
  email,
  password,
}: signupSchemaType) => {
  const existingUser = await pool.query(
    `SELECT id FROM Users where email=$1 `,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new AppError(409, "User already exists");
  }

  const passwordHash = await hashPassword(password);

  const otp = genOtp();
  const hashedOtp = await hashPassword(otp);
  const redisKey = `signup:${email}`;

  const signupData = JSON.stringify({
    name,
    email,
    passwordHash,
    hashedOtp,
    attempts: 0,
  });

  await redis.set(redisKey, signupData, "EX", 300);

  await sendOtpEmail(email, otp);

  return {
    message: "Verification otp sent to your mail",
  };
};

export const verifySignupService = async ({
  email,
  otp,
}: verifySignUpSchemaType) => {
  const redisKey = `signup:${email}`;

  const signupData = await redis.get(redisKey);

  if (!signupData) {
    throw new AppError(400, "OTP expired or sign up session not found");
  }

  const data = JSON.parse(signupData);

  if (data.attempts > 5) {
    await redis.del(redisKey);

    throw new AppError(
      429,
      "Too many sign up attempts ,please try again after some time",
    );
  }

  const isValidOtp = await verifyPassword(otp, data.hashedOtp);

  if (!isValidOtp) {
    data.attempts += 1;

    const ttl = await redis.ttl(redisKey);

    await redis.set(redisKey, JSON.stringify(data), "EX", ttl);

    throw new AppError(400, "Invalid otp");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users
       (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [data.name, data.email, data.passwordHash],
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(
      `SELECT id FROM roles WHERE name = $1`,
      ["user"],
    );

    if (roleResult.rows.length === 0) {
      throw new AppError(500, "Default user role not configured");
    }

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)`,
      [user.id, roleResult.rows[0].id],
    );

    await client.query("COMMIT");
    await redis.del(redisKey);

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const loginService = async ({ email, password }: loginSchemaType) => {
  const user = await pool.query(
    `SELECT id,password_hash FROM Users WHERE email=$1`,
    [email],
  );

  if (user.rows.length < 1) {
    throw new AppError(401, "Invalid credentials");
  }

  const isPassValid = await verifyPassword(
    password,
    user.rows[0].password_hash,
  );

  if (!isPassValid) {
    throw new AppError(401, "Invalid credentials");
  }

  const loggedinUser = user.rows[0].id;

  const accessToken = await generateAccessToken(loggedinUser);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  const familyId = crypto.randomUUID();

  await pool.query(
    `
    INSERT INTO refresh_tokens (
      user_id,
      family_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2,$3, NOW() + INTERVAL '7 days')
  `,
    [user.rows[0].id, familyId, hashedRefreshToken],
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        id,
        user_id,
        family_id,
        expires_at,
        revoked_at,
        replaced_by
      FROM refresh_tokens
      WHERE token_hash = $1
      FOR UPDATE
      `,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      throw new AppError(401, "Invalid refresh token");
    }

    const storedToken = result.rows[0];

    if (storedToken.revoked_at !== null) {
      await client.query(
        `
    UPDATE refresh_tokens
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE family_id = $1
    `,
        [storedToken.family_id],
      );

      throw new AppError(401, "Invalid refresh token");
    }

    if (new Date(storedToken.expires_at) <= new Date()) {
      throw new AppError(401, "Refresh token expired");
    }

    const newAccessToken = await generateAccessToken(storedToken.user_id);

    const newRefreshToken = generateRefreshToken();

    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    const newTokenResult = await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        family_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW() + INTERVAL '7 days'
      )
      RETURNING id
      `,
      [storedToken.user_id, storedToken.family_id, newRefreshTokenHash],
    );

    const newTokenId = newTokenResult.rows[0].id;

    await client.query(
      `
      UPDATE refresh_tokens
      SET
        revoked_at = NOW(),
        replaced_by = $1
      WHERE id = $2
      `,
      [newTokenId, storedToken.id],
    );

    await client.query("COMMIT");

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
