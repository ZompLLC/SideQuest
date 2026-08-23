import "dotenv/config";
import express, { Request, Response } from "express";
import { checkDbConnection } from "./db.js";
import { logger, requestLogger, winstonLogger } from "./src/logger.js";
import { authRouter } from "./src/routes/auth.routes.js";
import { groupRouter } from "./src/routes/group.routes.js";
import { userRouter } from "./src/routes/user.routes.js";
import { requireAuth } from "./src/middleware/requireAuth.js";

// load environment vars
const deployEnv = process.env.NODE_ENV || "dev";

const app = express();

app.use(express.json());
app.use(logger);
app.use(requireAuth);
app.use(requestLogger);

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use(authRouter);
app.use(groupRouter);
app.use(userRouter);

checkDbConnection()
  .then(() => {
    app.listen(3000, () => {
      winstonLogger.info("Server listening at http://localhost:3000");
      winstonLogger.info(`Target environment: ${deployEnv}`);
    });
  })
  .catch((err) => {
    winstonLogger.error("Failed to connect to the database", { err });
    process.exit(1);
  });
