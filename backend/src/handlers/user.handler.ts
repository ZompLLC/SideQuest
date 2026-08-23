import { Request, Response } from "express";
import {
  DuplicateUsernameError,
  findUserById,
  updateUsername,
} from "../../db.js";
import { ApiError, sendError } from "../errors.js";
import { UpdateUserRequestModel, UserStatsModel } from "../models/user.model.js";

// GET /users/:userId
// NOTE: no auth for now -- userId comes straight from the URL.
export async function getMe(
  req: Request<{ userId: string }>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;

  req.log.info("getMe: request received", { userId });

  let user;
  try {
    user = await findUserById(userId);
  } catch (err) {
    req.log.error("getMe: failed to look up user", { userId, err });
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
    req.log.warn("getMe: no matching user", { userId });
    sendError(res, new ApiError(404, "USER_NOT_FOUND", "No user found with that ID."));
    return;
  }

  res.status(200).json(user);
}

// PATCH /users/:userId
// NOTE: no auth for now -- userId comes straight from the URL.
export async function updateMe(
  req: Request<{ userId: string }, {}, UpdateUserRequestModel>,
  res: Response,
): Promise<void> {
  const { userId } = req.params;
  const { username } = req.body;

  req.log.info("updateMe: request received", { userId });

  if (!username || username.length < 3 || username.length > 20) {
    req.log.warn("updateMe: validation failed, bad username", { userId });
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Username must be between 3 and 20 characters.",
        { field: "username" },
      ),
    );
    return;
  }

  try {
    const user = await updateUsername(userId, username);
    if (!user) {
      req.log.warn("updateMe: no matching user", { userId });
      sendError(
        res,
        new ApiError(404, "USER_NOT_FOUND", "No user found with that ID."),
      );
      return;
    }
    req.log.info("updateMe: username updated successfully", { userId });
    res.status(200).json(user);
  } catch (err) {
    if (err instanceof DuplicateUsernameError) {
      req.log.warn("updateMe: username taken", { userId, username });
      sendError(res, new ApiError(409, "USERNAME_TAKEN", err.message));
      return;
    }
    req.log.error("updateMe: failed to update user", { userId, err });
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

// GET /users/:userId/stats
// NOTE: no auth for now -- userId comes straight from the URL. Also mocked --
// there's no groups/challenges/seasons schema yet to compute real streaks,
// completion rate, badges, or season history from.
export function getMeStats(req: Request<{ userId: string }>, res: Response): void {
  const { userId } = req.params;

  req.log.info("getMeStats: request received (mocked)", { userId });

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
