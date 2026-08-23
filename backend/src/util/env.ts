import { ServerError } from "../errors";

// Retrieves the value of an environment variable, throwing a ServerError if it is not set.
function getAndRequireEnv(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new ServerError(`Environment variable not set: ${envVar}`);
  }
  return value;
}

// Retrieves the value of JWT_SECRET_TOKEN from env, throwing a ServerError if it is not set.
export function getJwtSecret(): string {
  return getAndRequireEnv("JWT_SECRET_TOKEN");
}
