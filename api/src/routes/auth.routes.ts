import { Router } from "express";
import {
  signupController,
  verifySignupController,
  refreshTokenController,
  loginController,
  csrfController,
  forgotPasswordController,
  forgotPasswordVerify,
  logoutController,
} from "../controllers/auth.controller.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/signup", rateLimit(10, 15 * 60), signupController);
router.post("/verify-signup", rateLimit(10, 15 * 60), verifySignupController);
router.post("/login", rateLimit(10, 15 * 60), loginController);
router.post(
  "/refresh",
  rateLimit(30, 15 * 60),
  csrfProtection,
  refreshTokenController,
);
router.get("/csrf", rateLimit(30, 15 * 60), csrfController);
router.post(
  "/forgot-password",
  rateLimit(10, 15 * 60),
  forgotPasswordController,
);
router.post(
  "/verify-forgot-password",
  rateLimit(10, 15 * 60),
  forgotPasswordVerify,
);
router.post("/logout", rateLimit(10, 15 * 60), logoutController);

export default router;
