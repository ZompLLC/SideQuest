import jwt from "jsonwebtoken";

const EXPIRES_IN = "24h";

interface VerificationTokenPayload {
  sub: string; // userId
  purpose: "email_verification";
}

function getSecret(): string {
  const secret = process.env.JWT_VERIFICATION_SECRET;
  if (!secret) {
    throw new Error("JWT_VERIFICATION_SECRET is not set.");
  }
  return secret;
}

export function signVerificationToken(userId: string): string {
  const payload: VerificationTokenPayload = {
    sub: userId,
    purpose: "email_verification",
  };
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export type VerifyResult =
  { ok: true; userId: string } | { ok: false; reason: "expired" | "invalid" };

export function verifyVerificationToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, getSecret()) as VerificationTokenPayload;
    if (decoded.purpose !== "email_verification") {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, userId: decoded.sub };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "invalid" };
  }
}
