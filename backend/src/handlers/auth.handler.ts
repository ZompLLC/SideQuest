import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { ApiError, sendError } from "../errors.js";
import {
  LoginRequestModel,
  RegisterRequestModel,
} from "../models/auth.model.js";

// POST /register
export async function register(
  req: Request<{}, {}, RegisterRequestModel>,
  res: Response,
): Promise<void> {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Email, username, and password are required.",
      ),
    );
    return;
  }
  if (password.length < 8) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Password must be at least 8 characters.",
        { field: "password" },
      ),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: reject if email/username already exists -> 409 EMAIL_ALREADY_EXISTS
  // TODO: hash password, create user
  // =====================================
  const userId = randomUUID();

  res.status(201).json({
    id: userId,
    email,
    username,
    createdAt: new Date().toISOString(),
  });
}

// POST /login
export function login(
  req: Request<{}, {}, LoginRequestModel>,
  res: Response,
): void {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "Email and password are required."),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: look up user by email -> 401 INVALID_CREDENTIALS if no match
  // TODO: compare password against the stored hash -> 401 INVALID_CREDENTIALS on mismatch
  // =====================================
  const userId = "TODO-uuid";

  res.status(200).json({
    message: "successfully logged in",
    accessToken: "TODO-access-token",
    user: {
      id: userId,
      username: "TODO",
    },
  });
}

// POST /logout (requireAuth)
export function logout(req: Request, res: Response): void {
  // ===== Need Postgres for this ========
  // TODO: revoke the token tied to req.user's current session
  // =====================================
  res.status(204).send();
}
