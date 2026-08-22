import jwt from "jsonwebtoken";

const ACCESS_EXPIRES_IN = "1h";
export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 3600;
const REFRESH_EXPIRES_IN = "30d";

interface SessionTokenPayload {
  sub: string; // userId
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set.");
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set.");
  }
  return secret;
}

export function signAccessToken(userId: string): string {
  const payload: SessionTokenPayload = { sub: userId };
  return jwt.sign(payload, getAccessSecret(), { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(userId: string): string {
  const payload: SessionTokenPayload = { sub: userId };
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export type VerifyResult =
  { ok: true; userId: string } | { ok: false; reason: "expired" | "invalid" };

function verify(token: string, secret: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, secret) as SessionTokenPayload;
    return { ok: true, userId: decoded.sub };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "invalid" };
  }
}

export function verifyAccessToken(token: string): VerifyResult {
  return verify(token, getAccessSecret());
}

export function verifyRefreshToken(token: string): VerifyResult {
  return verify(token, getRefreshSecret());
}
