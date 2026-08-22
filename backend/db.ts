import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

// Confirms the database is reachable at boot. Schema is managed separately
// via migrations -- run `npm run migrate up` before starting the server.
export async function checkDbConnection(): Promise<void> {
  await pool.query("SELECT 1");
}

export class DuplicateUserError extends Error {}

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export async function createUser(
  id: string,
  email: string,
  username: string,
  passwordHash: string,
): Promise<UserRecord> {
  try {
    const result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, created_at`,
      [id, email, username, passwordHash],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      createdAt: row.created_at.toISOString(),
    };
  } catch (err: any) {
    if (err.code === "23505") {
      throw new DuplicateUserError(
        "An account with this email or username already exists.",
      );
    }
    throw err;
  }
}

export interface UserCredentials {
  id: string;
  username: string;
  passwordHash: string;
}

export async function findUserByEmail(
  email: string,
): Promise<UserCredentials | undefined> {
  const result = await pool.query(
    `SELECT id, username, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
  };
}
