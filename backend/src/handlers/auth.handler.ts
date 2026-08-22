import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { createUser, DuplicateUserError, findUserByEmail } from "../../db.js";
import { ApiError, sendError } from "../errors.js";
import {
  LoginRequestModel,
  RegisterRequestModel,
} from "../models/auth.model.js";

const PASSWORD_SALT_ROUNDS = 10;

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

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    const user = await createUser(userId, email, username, passwordHash);
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      sendError(res, new ApiError(409, "EMAIL_ALREADY_EXISTS", err.message));
      return;
    }
    console.error("Failed to create user:", err);
    sendError(
      res,
      new ApiError(
        500,
        "INTERNAL_ERROR",
        "Something went wrong. Please try again.",
      ),
    );
  }
}

// POST /login
export async function login(
  req: Request<{}, {}, LoginRequestModel>,
  res: Response,
): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "Email and password are required."),
    );
    return;
  }

  let user;
  try {
    user = await findUserByEmail(email);
  } catch (err) {
    console.error("Failed to look up user:", err);
    sendError(
      res,
      new ApiError(
        500,
        "INTERNAL_ERROR",
        "Something went wrong. Please try again.",
      ),
    );
    return;
  }

  if (!user) {
    sendError(
      res,
      new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect.",
      ),
    );
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    sendError(
      res,
      new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Email or password is incorrect.",
      ),
    );
    return;
  }

  res.status(200).json({
    message: "successfully logged in",
    accessToken: "TODO-access-token",
    user: {
      id: user.id,
      username: user.username,
    },
  });
}

// POST /logout (requireAuth)
export function logout(req: Request, res: Response): void {
  // ===== Still needs a real session store ========
  // TODO: revoke the token tied to req.user's current session
  // =====================================
  res.status(204).send();
}
