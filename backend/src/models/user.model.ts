// Response payload for GET /users/me and PATCH /users/me
export type UserProfileModel = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

// Request body for PATCH /users/me
export type UpdateUserRequestModel = {
  username: string;
};

// Response payload for GET /users/me/stats
// NOTE: mocked -- streaks/badges/season history depend on groups, challenges,
// and seasons tables that don't exist in the schema yet.
export type UserStatsModel = {
  currentStreak: number;
  completionRate: number;
  totalPointsAllTime: number;
  badges: string[];
  seasonHistory: {
    seasonId: string;
    groupId: string;
    placement: number;
    points: number;
  }[];
};
