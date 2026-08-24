import { Router } from "express";
import * as userHandler from "../handlers/user.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const userRouter = Router();

userRouter.get("/users/:userId", userHandler.getUser);
userRouter.patch("/users/:userId", requireAuth, userHandler.updateUser);
userRouter.get("/users/:userId/stats", userHandler.getUserStats);
