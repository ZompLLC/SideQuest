import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import {
  createUser,
  DuplicateUsernameError,
  DuplicateUserError,
  findUserByEmail,
} from "../../db.js";
import { sendError } from "../errors/errors.js";
import { AuthErrors } from "../errors/auth.errors";
import { UserErrors } from "../errors/user.errors";
import { CommonErrors, requireFields } from "../errors/common.errors";
import {
  LoginRequestModel,
  LoginResponseModel,
  RegisterRequestModel,
  RegisterResponseModel,
} from "../models/auth.model.js";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../util/env.js";

const JWT_SECRET = getJwtSecret();
const PASSWORD_SALT_ROUNDS = 10;

// POST /register
export async function register(
  req: Request<{}, {}, RegisterRequestModel>,
  res: Response<RegisterResponseModel>,
): Promise<void> {
  const { email, username, password } = req.body;

  req.log.info("register: request received", { email });

  const missing = requireFields(req.body, ["email", "username", "password"]);
  if (missing) {
    req.log.warn("register: validation failed, missing required fields");
    sendError(res, CommonErrors.missingField());
    return;
  }

  //TODO change to helper function to validate password
  if (password.length < 8) {
    req.log.warn("register: validation failed, password too short", { email });
    sendError(
      res,
      AuthErrors.weakPassword("Password needs to be 8 characters or longer."),
    );
    return;
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    const user = await createUser(userId, email, username, passwordHash);
    req.log.info("register: user created successfully", { userId, email });

    const authToken = await jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ ...user, authToken });
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      req.log.warn("register: duplicate username", { username });
      sendError(res, UserErrors.usernameTaken(err.message));
      return;
    }
    if (err instanceof DuplicateUserError) {
      req.log.warn("register: duplicate user", { email });
      sendError(res, AuthErrors.emailAlreadyExists(email));
      return;
    }
    req.log.error("register: failed to create user", { err });
    sendError(res, CommonErrors.internalError());
  }
}

// POST /login
export async function login(
  req: Request<{}, {}, LoginRequestModel>,
  res: Response<LoginResponseModel>,
): Promise<void> {
  const { email, password } = req.body;

  req.log.info("login: request received", { email });

  const missing = requireFields(req.body, ["email", "password"]);
  if (missing) {
    req.log.warn("login: validation failed, missing required fields");
    sendError(res, CommonErrors.missingField());
    return;
  }

  let user;
  try {
    user = await findUserByEmail(email);
  } catch (err) {
    req.log.error("login: failed to look up user", { err });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!user) {
    req.log.warn("login: failed, invalid email", { email });
    sendError(res, AuthErrors.invalidCredentials());
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    req.log.warn("login: failed, incorrect password", { email });
    sendError(res, AuthErrors.invalidCredentials());
    return;
  }

  req.log.info("login: user logged in successfully", {
    userId: user.id,
    email,
  });

  res.status(200).json({
    message: "successfully logged in",
    accessToken: "TODO-access-token",
    userId: user.id,
  });
}

// POST /logout
export function logout(req: Request, res: Response): void {
  // jwt is deleted on the client side
  res.status(204).send();
}
