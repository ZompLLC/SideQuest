import { ApiError } from "../errors";

export const USER_ERROR_CODES = ["USER_NOT_FOUND", "USERNAME_TAKEN"] as const;

export type UserErrorCode = (typeof USER_ERROR_CODES)[number];

export const UserErrors = {
  userNotFound: () =>
    new ApiError(404, "USER_NOT_FOUND", "No user found with that ID."),
  usernameTaken: (message: string) =>
    new ApiError(400, "USERNAME_TAKEN", message),
};
