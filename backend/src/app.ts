import express, { Request, Response } from "express";
import { logger, requestLogger } from "./util/logger.js";
import { authRouter } from "./routes/auth.routes.js";
import { groupRouter } from "./routes/group.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.use(express.json());
app.use(logger);
app.use(requestLogger);

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use(authRouter);
app.use(groupRouter);
app.use(userRouter);
