import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { ApiError, sendError } from "../errors.js";
import { sendVerificationEmail } from "../lib/mailer.js";
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/sessionToken.js";
import {
  signVerificationToken,
  verifyVerificationToken,
} from "../lib/verificationToken.js";
import {
  ForgotPasswordRequestModel,
  LoginRequestModel,
  RefreshRequestModel,
  RegisterRequestModel,
  ResendVerificationRequestModel,
  ResetPasswordRequestModel,
  VerifyEmailRequestModel,
} from "../models/auth.model.js";

// POST /register
export async function register(
  req: Request<{}, {}, RegisterRequestModel>,
  res: Response,
): Promise<void> {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Email, username, and password are required.",
      ),
    );
    return;
  }
  if (password.length < 8) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Password must be at least 8 characters.",
        { field: "password" },
      ),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: reject if email/username already exists -> 409 EMAIL_ALREADY_EXISTS
  // TODO: hash password, create user with emailVerified: false
  // =====================================
  const userId = randomUUID();

  const verificationToken = signVerificationToken(userId);
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (err) {
    // Account creation should still succeed even if the email send fails
    // (e.g. SMTP hiccup) -- the user can always hit /verify-email/resend.
    console.error("Failed to send verification email:", err);
  }

  res.status(201).json({
    id: userId,
    email,
    username,
    emailVerified: false,
    message: `${username} must be verified`,
    createdAt: new Date().toISOString(),
  });
}

// POST /verify-email/resend
export async function resendVerification(
  req: Request<{}, {}, ResendVerificationRequestModel>,
  res: Response,
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "Provide a valid email address.", {
        field: "email",
      }),
    );
    return;
  }

  // TODO: look up the user by email (Postgres). If found and still unverified,
  // sign a new token for their real userId and send it -- swap the TODO id below.
  // Always return 200 regardless of whether the account exists, to avoid leaking existence.
  // Verification email disabled for now.
  // try {
  //   const userId = "TODO-look-up-user-id-by-email";
  //   const verificationToken = signVerificationToken(userId);
  //   await sendVerificationEmail(email, verificationToken);
  // } catch (err) {
  //   console.error("Failed to resend verification email:", err);
  // }

  res.status(200).json({ message: "Verification email resent." });
}

// POST /verify-email
export function verifyEmail(
  req: Request<{}, {}, VerifyEmailRequestModel>,
  res: Response,
): void {
  const { token } = req.body;

  if (!token) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "A verification token is required.",
      ),
    );
    return;
  }

  const result = verifyVerificationToken(token);

  if (!result.ok && result.reason === "expired") {
    sendError(
      res,
      new ApiError(
        410,
        "TOKEN_EXPIRED",
        "This verification link has expired. Request a new one.",
        { resendEndpoint: "/verify-email/resend" },
      ),
    );
    return;
  }
  if (!result.ok) {
    sendError(
      res,
      new ApiError(
        404,
        "TOKEN_NOT_FOUND",
        "This verification link is invalid.",
      ),
    );
    return;
  }

  // TODO: look up user by result.userId (Postgres) -> 404 TOKEN_NOT_FOUND if the
  // user no longer exists.
  // TODO: if already verified -> 409 ALREADY_VERIFIED
  // TODO: mark user emailVerified = true, persist verifiedAt

  res.status(200).json({
    id: result.userId,
    email: "TODO@example.com",
    emailVerified: true,
    verifiedAt: new Date().toISOString(),
    message: "successfully verified",
  });
}

// POST /login
export function login(
  req: Request<{}, {}, LoginRequestModel>,
  res: Response,
): void {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "Email and password are required."),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: look up user by email -> 401 INVALID_CREDENTIALS if no match
  // TODO: compare password against the stored hash -> 401 INVALID_CREDENTIALS on mismatch
  // TODO: if credentials correct but emailVerified === false -> 403 EMAIL_NOT_VERIFIED
  //       (details.resendEndpoint: '/verify-email/resend')
  // =====================================
  // WARNING: until the above lands, this accepts any email/password and issues
  // real tokens for a placeholder user -- not safe to expose beyond local dev.
  const userId = "TODO-uuid";

  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  res.status(200).json({
    message: "successfully logged in",
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    user: {
      id: userId,
      username: "TODO",
      emailVerified: true,
    },
  });
}

// POST /auth/refresh
export function refresh(
  req: Request<{}, {}, RefreshRequestModel>,
  res: Response,
): void {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    sendError(
      res,
      new ApiError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or has expired. Please log in again.",
      ),
    );
    return;
  }

  const result = verifyRefreshToken(refreshToken);
  if (!result.ok) {
    sendError(
      res,
      new ApiError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token is invalid or has expired. Please log in again.",
      ),
    );
    return;
  }

  // TODO: check the refresh token hasn't been revoked (Postgres/session store)
  // -> 401 INVALID_REFRESH_TOKEN if it has been.

  const accessToken = signAccessToken(result.userId);

  res.status(200).json({
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  });
}

// POST /auth/logout (requireAuth)
export function logout(req: Request, res: Response): void {
  // ===== Need Postgres for this ========
  // TODO: revoke the refresh token tied to req.user's current session
  // =====================================
  res.status(204).send();
}

// POST /auth/forgot-password
export function forgotPassword(
  req: Request<{}, {}, ForgotPasswordRequestModel>,
  res: Response,
): void {
  const { email } = req.body;

  if (!email) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "Provide a valid email address.", {
        field: "email",
      }),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: look up the user by email.
  // =====================================
  // Verification/reset email disabled for now.
  // TODO: if a matching account exists, sign a reset token (same pattern as
  // signVerificationToken) and send it via sendVerificationEmail-style call.
  // Always return 200 regardless of whether the email exists.

  res.status(200).json({
    message: "If that email is registered, a reset link has been sent.",
  });
}

// POST /auth/reset-password
export function resetPassword(
  req: Request<{}, {}, ResetPasswordRequestModel>,
  res: Response,
): void {
  const { token, newPassword } = req.body;

  if (!token) {
    sendError(
      res,
      new ApiError(400, "VALIDATION_ERROR", "A reset token is required."),
    );
    return;
  }
  if (!newPassword || newPassword.length < 8) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Password must be at least 8 characters.",
        { field: "newPassword" },
      ),
    );
    return;
  }

  // ===== Need Postgres for this ========
  // TODO: look up token -> 404 TOKEN_NOT_FOUND if unknown
  // TODO: if expired -> 410 TOKEN_EXPIRED
  // TODO: hash + set new password, invalidate the reset token (and existing sessions, if desired)
  // =====================================

  res.status(200).json({ message: "Password has been reset. Please log in." });
}
