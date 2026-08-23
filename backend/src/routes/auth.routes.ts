import { Router } from "express";
import * as authHandler from "../handlers/auth.handler.js";

export const authRouter = Router();

authRouter.post("/register", authHandler.register);
authRouter.post("/login", authHandler.login);
authRouter.post("/logout", authHandler.logout);
