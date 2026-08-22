import { NextFunction, Request, Response } from "express";
import { ApiError, sendError } from "../errors.js";
import { AuthenticatedUserModel } from "../models/auth.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserModel;
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

  // TODO: verify the token for real and look up the user.
  req.user = { id: "TODO", username: "TODO" };
  next();
}
