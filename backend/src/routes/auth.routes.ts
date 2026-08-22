import { Router } from "express";
import * as authHandler from "../handlers/auth.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/register", authHandler.register);
authRouter.post("/verify-email/resend", authHandler.resendVerification);
authRouter.post("/verify-email", authHandler.verifyEmail);
authRouter.post("/login", authHandler.login);
authRouter.post("/refresh", authHandler.refresh);
authRouter.post("/logout", requireAuth, authHandler.logout);
authRouter.post("/forgot-password", authHandler.forgotPassword);
authRouter.post("/reset-password", authHandler.resetPassword);
