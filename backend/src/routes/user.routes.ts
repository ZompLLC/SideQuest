import { Router } from "express";
import * as userHandler from "../handlers/user.handler.js";

export const userRouter = Router();

userRouter.get("/users/:userId", userHandler.getUser);
userRouter.patch("/users/:userId", userHandler.updateUser);
userRouter.get("/users/:userId/stats", userHandler.getUserStats);
