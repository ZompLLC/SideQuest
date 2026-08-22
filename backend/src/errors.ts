import { Response } from "express";

// error.code values used across the auth endpoints (API doc Appendix B)
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "TOKEN_NOT_FOUND"
  | "ALREADY_VERIFIED"
  | "TOKEN_EXPIRED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_REFRESH_TOKEN"
  | "UNAUTHORIZED";

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
