import { Router } from "express";
import {
  signupController,
  verifySignupController,
  refreshTokenController,
  loginController,
  csrfController,
} from "../controllers/auth.controller.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";

const router = Router();

router.post("/signup", signupController);
router.post("/verify-signup", verifySignupController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);
router.get("csrf", csrfProtection, csrfController);

export default router;
