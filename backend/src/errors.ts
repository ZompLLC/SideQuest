import { Response } from "express";
import { AuthErrorCode, AUTH_ERROR_CODES } from "./errors/auth.errors";
import { CommonErrorCode, COMMON_ERROR_CODES } from "./errors/common.errors";
import { GroupErrorCode, GROUP_ERROR_CODES } from "./errors/group.errors";
import { USER_ERROR_CODES, UserErrorCode } from "./errors/user.errors";

export type ErrorCode =
  | AuthErrorCode
  | CommonErrorCode
  | GroupErrorCode
  | UserErrorCode;

export const ALL_ERROR_CODES = [
  ...AUTH_ERROR_CODES,
  ...COMMON_ERROR_CODES,
  ...GROUP_ERROR_CODES,
  ...USER_ERROR_CODES,
] as const;

// Runtime type guard — narrows `string` to `ErrorCode`
export function isErrorCode(value: string): value is ErrorCode {
  return (ALL_ERROR_CODES as readonly string[]).includes(value);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function sendError(res: Response, err: ApiError): void {
  res.status(err.status).json({
    error: {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
