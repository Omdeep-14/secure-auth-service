import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils.ts/appError.js";
import { pool } from "../config/db.js";

export const checkRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }
    const result = await pool.query(
      `
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [req.user.id],
    );

    const userRoles = result.rows.map((row) => row.name);

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      throw new AppError(403, "Forbidden");
    }

    next();
  };
};
