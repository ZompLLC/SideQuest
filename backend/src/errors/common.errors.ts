// common.error.ts
import { ApiError } from "../errors";

export const COMMON_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
] as const;
export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];

export const CommonErrors = {
  validationError: (message: string, details?: Record<string, unknown>) =>
    new ApiError(400, "VALIDATION_ERROR", message, details),

  missingField: (message = "At least one required field is empty.") =>
    new ApiError(400, "VALIDATION_ERROR", message),

  internalError: (message = "Something went wrong.") =>
    new ApiError(500, "INTERNAL_ERROR", message),
};

/**
 * @param body req.body
 * @param fields fields to validate
 * @returns null if all fields were found, returns CommonErrors.missingField if field is missing
 */
export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[],
): string | null {
  for (const field of fields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ""
    ) {
      return String(field);
    }
  }
  return null;
}
