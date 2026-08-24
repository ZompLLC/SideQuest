import bcrypt from "bcrypt";
import { Request, Response } from "express";
import {
  DuplicateUsernameError,
  DuplicateUserError,
  findUserById,
  findUserCredentialsById,
  updateUserFields,
} from "../../db.js";
import { sendError } from "../errors/errors.js";
import { UserErrors } from "../errors/user.errors";
import { AuthErrors } from "../errors/auth.errors";
import { CommonErrors } from "../errors/common.errors";
import { UpdateUserRequestModel, UserStatsModel } from "../models/user.model.js";

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
// Auth: requester must be updating their own account. Accepts any subset
// of username/newPassword/email in one request; currentPassword is
// required whenever newPassword or email is present.
export async function updateUser(
  req: Request<{ userId: string }, Record<string, never>, UpdateUserRequestModel>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { username, currentPassword, newPassword, email } = req.body;

  req.log.info("updateUser: request received", { userId });

  if (req.userId !== userId) {
    req.log.info("updateUser: forbidden, not own account", {
      userId,
      requesterId: req.userId,
    });
    sendError(
      res,
      AuthErrors.unauthorized("You can only update your own account."),
    );
    return;
  }

  if (username === undefined && newPassword === undefined && email === undefined) {
    req.log.info("updateUser: validation failed, nothing to update", {
      userId,
    });
    sendError(
      res,
      CommonErrors.missingField(
        "At least one of username, newPassword, or email is required.",
      ),
    );
    return;
  }

  if (username !== undefined && (username.length < 3 || username.length > 20)) {
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

  if (newPassword !== undefined && newPassword.length < 8) {
    req.log.info("updateUser: validation failed, weak password", { userId });
    sendError(
      res,
      AuthErrors.weakPassword("Password needs to be 8 characters or longer."),
    );
    return;
  }

  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    req.log.info("updateUser: validation failed, bad email format", {
      userId,
    });
    sendError(res, AuthErrors.invalidEmailFormat(email));
    return;
  }

  let passwordHash: string | undefined;
  if (newPassword !== undefined || email !== undefined) {
    if (!currentPassword) {
      req.log.info("updateUser: validation failed, missing current password", {
        userId,
      });
      sendError(
        res,
        CommonErrors.missingField(
          "currentPassword is required to change your password or email.",
        ),
      );
      return;
    }

    let credentials;
    try {
      credentials = await findUserCredentialsById(userId);
    } catch (err) {
      req.log.info("updateUser: failed to look up user", { userId, err });
      sendError(res, CommonErrors.internalError());
      return;
    }

    if (!credentials) {
      req.log.info("updateUser: no matching user", { userId });
      sendError(res, UserErrors.userNotFound());
      return;
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      credentials.passwordHash,
    );
    if (!currentPasswordMatches) {
      req.log.info("updateUser: current password incorrect", { userId });
      sendError(res, AuthErrors.invalidCredentials());
      return;
    }

    if (newPassword !== undefined) {
      passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    }
  }

  try {
    const user = await updateUserFields(userId, {
      username,
      passwordHash,
      email,
    });
    if (!user) {
      req.log.info("updateUser: no matching user", { userId });
      sendError(res, UserErrors.userNotFound());
      return;
    }
    req.log.info("updateUser: user updated successfully", { userId });
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      req.log.info("updateUser: username taken", { userId, username });
      sendError(res, UserErrors.usernameTaken(err.message));
      return;
    }
    if (err instanceof DuplicateUserError) {
      req.log.info("updateUser: email already in use", { userId });
      sendError(res, AuthErrors.emailAlreadyExists(email!));
      return;
    }
    req.log.info("updateUser: failed to update user", { userId, err });
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
