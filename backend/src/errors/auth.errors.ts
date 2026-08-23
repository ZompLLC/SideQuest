import { ApiError } from "../errors";

export const AUTH_ERROR_CODES = [
  "EMAIL_ALREADY_EXISTS",
  "INVALID_EMAIL_FORMAT",
  "INVALID_USERNAME_FORMAT",
  "WEAK_PASSWORD",
  "INVALID_CREDENTIALS",
  "UNAUTHORIZED",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export const AuthErrors = {
  emailAlreadyExists: (email: string) =>
    new ApiError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists.",
      { email },
    ),

  invalidEmailFormat: (email: string) =>
    new ApiError(
      400,
      "INVALID_EMAIL_FORMAT",
      "Please enter a valid email address.",
      { email },
    ),

  invalidUsernameFormat: (username: string) =>
    new ApiError(
      400,
      "INVALID_USERNAME_FORMAT",
      "Username must be 3-20 characters, letters/numbers/underscores only.",
      { username },
    ),

  weakPassword: (reason: string) =>
    new ApiError(
      400,
      "WEAK_PASSWORD",
      "Password does not meet security requirements.",
      { reason },
    ),

  invalidCredentials: () =>
    new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect."),

  unauthorized: (reason?: string) =>
    new ApiError(
      401,
      "UNAUTHORIZED",
      reason ?? "You must be logged in to perform this action.",
    ),
};
