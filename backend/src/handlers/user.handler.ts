import { Request, Response } from "express";
import {
  DuplicateUsernameError,
  findUserById,
  updateUsername,
} from "../../db.js";
import { sendError } from "../errors.js";
import { UserErrors } from "../errors/user.errors";
import { CommonErrors } from "../errors/common.errors";
import {
  UpdateUserRequestModel,
  UserStatsModel,
} from "../models/user.model.js";

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
    req.log.error("getUser: failed to look up user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!user) {
    req.log.warn("getUser: no matching user", { userId });
    sendError(res, UserErrors.userNotFound());
    return;
  }

  res.status(200).json(user);
}

// PATCH /users/:userId
// NOTE: no auth for now -- userId comes straight from the URL.
export async function updateUser(
  req: Request<{ userId: string }, {}, UpdateUserRequestModel>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { username } = req.body;

  req.log.info("updateUser: request received", { userId });

  if (!username || username.length < 3 || username.length > 20) {
    req.log.warn("updateUser: validation failed, bad username", { userId });
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
      req.log.warn("updateUser: no matching user", { userId });
      sendError(res, UserErrors.userNotFound());
      return;
    }
    req.log.info("updateUser: username updated successfully", { userId });
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      req.log.warn("updateUser: username taken", { userId, username });
      sendError(res, UserErrors.usernameTaken(err.message));
      return;
    }
    req.log.error("updateUser: failed to update user", { userId, err });
    sendError(res, CommonErrors.internalError());
    return;
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
