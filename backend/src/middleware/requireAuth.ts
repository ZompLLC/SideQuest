import { NextFunction, Request, Response } from "express";
import { ApiError, sendError } from "../errors.js";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../util/env.js";

const JWT_SECRET = getJwtSecret();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Verifies the `Authorization: Bearer <token>` header and attaches req.user.
// Used on any route documented as "Auth: Bearer token required".
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;

  if (!token) {
    sendError(
      res,
      new ApiError(
        401,
        "UNAUTHORIZED",
        "You must be logged in to perform this action.",
      ),
    );
    return;
  }

  const payload = jwt.verify(token, JWT_SECRET);

  if (typeof payload === "string" || typeof payload.userId !== "string") {
    req.log.warn("requireAuth: authentication token has an invalid payload.", {
      payload,
    });
    sendError(
      res,
      new ApiError(
        401,
        "UNAUTHORIZED",
        "You must be logged in to perform this action.",
      ),
    );
    return;
  }

  req.userId = payload.userId;
  next();
}
