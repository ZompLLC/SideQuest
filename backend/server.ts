import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { checkDbConnection } from "./db.js";
import { accessLogger, logger, requestLogger } from "./src/logger.js";
import { authRouter } from "./src/routes/auth.routes.js";

// load environment vars
const deployEnv = process.env.NODE_ENV || "dev";
const envFile = deployEnv === "prod" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(accessLogger);

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use(authRouter);

checkDbConnection()
  .then(() => {
    app.listen(3000, () => {
      logger.info("Server listening at http://localhost:3000");
      logger.info(`Target environment: ${deployEnv}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to connect to the database", { err });
    process.exit(1);
  });
