import { Router } from "express";
import { tokenMiddleware } from "../middlewares/tokenCheck.middleware.js";
import { checkRole } from "../middlewares/role.middleware.js";
import {
  userDashboardController,
  adminDashboardController,
  commonDashboardController,
} from "../controllers/rbac.controller.js";

const router = Router();

router.get(
  "/user",
  tokenMiddleware,
  checkRole("user"),
  userDashboardController,
);
router.get(
  "/admin",
  tokenMiddleware,
  checkRole("admin"),
  adminDashboardController,
);
router.get(
  "/common",
  tokenMiddleware,
  checkRole("user", "admin"),
  commonDashboardController,
);

export default router;
