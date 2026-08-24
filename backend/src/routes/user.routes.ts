import { Router } from "express";
import * as userHandler from "../handlers/user.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const userRouter = Router();

userRouter.get("/users/:userId", userHandler.getUser);
userRouter.patch("/users/:userId", userHandler.updateUser);
userRouter.patch(
  "/users/:userId/password",
  requireAuth,
  userHandler.changePassword,
);
userRouter.patch("/users/:userId/email", requireAuth, userHandler.changeEmail);
userRouter.get("/users/:userId/stats", userHandler.getUserStats);
