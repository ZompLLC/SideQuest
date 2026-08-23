import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import winston from "winston";
import expressWinston from "express-winston";

const isDev = (process.env.NODE_ENV || "dev") !== "prod";

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} ${level}: ${message}${rest}`;
        }),
      )
    : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Auto-logs every request/response as a single slim line (method, url, statusCode).
export const requestLogger = expressWinston.logger({
  winstonInstance: winstonLogger,
  requestWhitelist: ["method", "url"],
  responseWhitelist: ["statusCode"],
  bodyBlacklist: ["password", "passwordHash"],
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  meta: false,
  expressFormat: false,
});

// Attaches a per-request child logger (req.log) tagged with a request id,
// mirroring the req.log pattern the handlers already use.
export function logger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const reqId = randomUUID();
  req.log = winstonLogger.child({ reqId });
  next();
}

declare module "express-serve-static-core" {
  interface Request {
    log: winston.Logger;
  }
}
