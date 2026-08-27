import type { Request, Response } from "express";

export const userDashboardController = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "You have access to the user resource",
  });
};

export const adminDashboardController = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "You have access to the admin resource",
  });
};

export const commonDashboardController = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "You have access to common resource",
  });
};
