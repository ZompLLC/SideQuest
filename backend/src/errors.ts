import { Response } from "express";

// error.code values used across the auth endpoints
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "USERNAME_TAKEN"
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

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

export function sendError(res: Response, err: ApiError): void {
  res.status(err.status).json({
    error: {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
