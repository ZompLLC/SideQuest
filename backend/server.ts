import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { authRouter } from "./src/routes/auth.routes.js";

// load environment vars
const deployEnv = process.env.NODE_ENV || "dev";
const envFile = deployEnv === "prod" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const app = express();

app.use(express.json());

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use(authRouter);

app.listen(3000, () => {
  console.log("Server listening at http://localhost:3000");
  console.log(`Target environment: ${deployEnv}`);
});