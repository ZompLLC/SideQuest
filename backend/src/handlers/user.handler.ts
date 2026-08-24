import bcrypt from "bcrypt";
import { Request, Response } from "express";
import {
  DuplicateUsernameError,
  DuplicateUserError,
  findUserById,
  findUserCredentialsById,
  updateUsername,
  updatePassword,
  updateEmail,
} from "../../db.js";
import { sendError } from "../errors/errors.js";
import { UserErrors } from "../errors/user.errors";
import { AuthErrors } from "../errors/auth.errors";
import { CommonErrors, requireFields } from "../errors/common.errors";
import {
  ChangeEmailRequestModel,
  ChangePasswordRequestModel,
  UpdateUserRequestModel,
  UserStatsModel,
} from "../models/user.model.js";

const PASSWORD_SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /users/:userId
// NOTE: no auth for now -- userId comes straight from the URL.
export async function getUser(
  req: Request<{ userId: string }>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;

  req.log.info("getUser: request received", { userId });

  let user;
  try {
    user = await findUserById(userId);
  } catch (err) {
    req.log.info("getUser: failed to look up user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!user) {
    req.log.info("getUser: no matching user", { userId });
    sendError(res, UserErrors.userNotFound());
    return;
  }

  res.status(200).json(user);
}

// PATCH /users/:userId
// NOTE: no auth for now -- userId comes straight from the URL.
export async function updateUser(
  req: Request<{ userId: string }, Record<string, never>, UpdateUserRequestModel>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { username } = req.body;

  req.log.info("updateUser: request received", { userId });

  if (!username || username.length < 3 || username.length > 20) {
    req.log.info("updateUser: validation failed, bad username", { userId });
    sendError(
      res,
      CommonErrors.validationError(
        "Username must be between 3 and 20 characters.",
        { field: "username" },
      ),
    );
    return;
  }

  try {
    const user = await updateUsername(userId, username);
    if (!user) {
      req.log.info("updateUser: no matching user", { userId });
      sendError(res, UserErrors.userNotFound());
      return;
    }
    req.log.info("updateUser: username updated successfully", { userId });
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      req.log.info("updateUser: username taken", { userId, username });
      sendError(res, UserErrors.usernameTaken(err.message));
      return;
    }
    req.log.info("updateUser: failed to update user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
  }
}

// PATCH /users/:userId/password
// Auth: requester must be changing their own password.
export async function changePassword(
  req: Request<
    { userId: string },
    Record<string, never>,
    ChangePasswordRequestModel
  >,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  req.log.info("changePassword: request received", { userId });

  if (req.userId !== userId) {
    req.log.info("changePassword: forbidden, not own account", {
      userId,
      requesterId: req.userId,
    });
    sendError(
      res,
      AuthErrors.unauthorized("You can only change your own password."),
    );
    return;
  }

  const missing = requireFields(req.body, ["currentPassword", "newPassword"]);
  if (missing) {
    req.log.info("changePassword: validation failed, missing required fields", {
      userId,
    });
    sendError(res, CommonErrors.missingField());
    return;
  }

  if (newPassword.length < 8) {
    req.log.info("changePassword: validation failed, weak password", {
      userId,
    });
    sendError(
      res,
      AuthErrors.weakPassword("Password needs to be 8 characters or longer."),
    );
    return;
  }

  let credentials;
  try {
    credentials = await findUserCredentialsById(userId);
  } catch (err) {
    req.log.info("changePassword: failed to look up user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!credentials) {
    req.log.info("changePassword: no matching user", { userId });
    sendError(res, UserErrors.userNotFound());
    return;
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    credentials.passwordHash,
  );
  if (!currentPasswordMatches) {
    req.log.info("changePassword: current password incorrect", { userId });
    sendError(res, AuthErrors.invalidCredentials());
    return;
  }

  try {
    const newPasswordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await updatePassword(userId, newPasswordHash);
    req.log.info("changePassword: password updated successfully", { userId });
    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    req.log.info("changePassword: failed to update password", {
      userId,
      err,
    });
    sendError(res, CommonErrors.internalError());
  }
}

// PATCH /users/:userId/email
// Auth: requester must be changing their own email.
export async function changeEmail(
  req: Request<
    { userId: string },
    Record<string, never>,
    ChangeEmailRequestModel
  >,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { currentPassword, newEmail } = req.body;

  req.log.info("changeEmail: request received", { userId });

  if (req.userId !== userId) {
    req.log.info("changeEmail: forbidden, not own account", {
      userId,
      requesterId: req.userId,
    });
    sendError(
      res,
      AuthErrors.unauthorized("You can only change your own email."),
    );
    return;
  }

  const missing = requireFields(req.body, ["currentPassword", "newEmail"]);
  if (missing) {
    req.log.info("changeEmail: validation failed, missing required fields", {
      userId,
    });
    sendError(res, CommonErrors.missingField());
    return;
  }

  if (!EMAIL_REGEX.test(newEmail)) {
    req.log.info("changeEmail: validation failed, bad email format", {
      userId,
    });
    sendError(res, AuthErrors.invalidEmailFormat(newEmail));
    return;
  }

  let credentials;
  try {
    credentials = await findUserCredentialsById(userId);
  } catch (err) {
    req.log.info("changeEmail: failed to look up user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!credentials) {
    req.log.info("changeEmail: no matching user", { userId });
    sendError(res, UserErrors.userNotFound());
    return;
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    credentials.passwordHash,
  );
  if (!currentPasswordMatches) {
    req.log.info("changeEmail: current password incorrect", { userId });
    sendError(res, AuthErrors.invalidCredentials());
    return;
  }

  try {
    const user = await updateEmail(userId, newEmail);
    if (!user) {
      req.log.info("changeEmail: no matching user", { userId });
      sendError(res, UserErrors.userNotFound());
      return;
    }
    req.log.info("changeEmail: email updated successfully", { userId });
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      req.log.info("changeEmail: email already in use", { userId });
      sendError(res, AuthErrors.emailAlreadyExists(newEmail));
      return;
    }
    req.log.info("changeEmail: failed to update email", { userId, err });
    sendError(res, CommonErrors.internalError());
  }
}

// GET /users/:userId/stats
// NOTE: no auth for now -- userId comes straight from the URL. Also mocked --
// there's no groups/challenges/seasons schema yet to compute real streaks,
// completion rate, badges, or season history from.
export function getUserStats(
  req: Request<{ userId: string }>,
  res: Response,
): void {
  const { userId } = req.params;

  req.log.info("getUserStats: request received (mocked)", { userId });

  const stats: UserStatsModel = {
    currentStreak: 4,
    completionRate: 0.82,
    totalPointsAllTime: 1340,
    badges: ["early-bird", "closer"],
    seasonHistory: [
      { seasonId: "s_202606", groupId: "g_1", placement: 1, points: 220 },
    ],
  };

  res.status(200).json(stats);
}
