import dotenv from "dotenv";
import express, { Request, Response } from "express";

// load environment vars
const deployEnv = process.env.NODE_ENV || "dev";
const envFile = deployEnv === "prod" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const app = express();

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server listening at http://localhost:3000");
  console.log(`Target environment: ${deployEnv}`);
});
