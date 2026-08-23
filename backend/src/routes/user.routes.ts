import { Router } from "express";
import * as userHandler from "../handlers/user.handler.js";

export const userRouter = Router();

userRouter.get("/users/:userId", userHandler.getMe);
userRouter.patch("/users/:userId", userHandler.updateMe);
userRouter.get("/users/:userId/stats", userHandler.getMeStats);
