import { DatabaseError, Pool } from "pg";
import {
  CreateQuestRequestModel,
  CreateQuestResponseModel,
  GetQuestResponseModel,
  ListQuestsResponseModel,
  QuestModel,
  UpdateQuestRequestModel,
} from "./src/models/quest.model";

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
export class DuplicateUsernameError extends Error {}

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
  } catch (err) {
    if (err instanceof DatabaseError && err.code === "23505") {
      if (err.constraint === "users_username_key") {
        throw new DuplicateUsernameError("That username is already taken.");
      }
      throw new DuplicateUserError(
        "An account with this email already exists.",
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

export async function findUserById(
  id: string,
): Promise<UserRecord | undefined> {
  const result = await pool.query(
    `SELECT id, email, username, created_at FROM users WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    createdAt: row.created_at.toISOString(),
  };
}

export async function updateUsername(
  id: string,
  username: string,
): Promise<UserRecord | undefined> {
  try {
    const result = await pool.query(
      `UPDATE users SET username = $2 WHERE id = $1
       RETURNING id, email, username, created_at`,
      [id, username],
    );
    const row = result.rows[0];
    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      createdAt: row.created_at.toISOString(),
    };
  } catch (err) {
    if (err instanceof DatabaseError && err.code === "23505") {
      throw new DuplicateUsernameError("That username is already in use.");
    }
    throw err;
  }
}

export interface GroupRecord {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  seasonLength: number;
  createdAt: string;
}

const GROUP_SELECT_COLUMNS = `
  g.id,
  g.name,
  g.owner_id,
  g.invite_code,
  g.member_count,
  g.season_length,
  g.created_at
`;

type RawGroupRow = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  member_count: string;
  season_length: number;
  created_at: Date;
};

function mapGroupRow(row: RawGroupRow): GroupRecord {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
    memberCount: parseInt(row.member_count, 10),
    seasonLength: row.season_length,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createGroup(
  id: string,
  name: string,
  ownerId: string,
  inviteCode: string,
  seasonLength: number,
): Promise<GroupRecord> {
  try {
    const result = await pool.query(
      `INSERT INTO groups (id, name, owner_id, invite_code, season_length)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, owner_id, invite_code, season_length, created_at`,
      [id, name, ownerId, inviteCode, seasonLength],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      inviteCode: row.invite_code,
      memberCount: 1,
      seasonLength: row.season_length,
      createdAt: row.created_at.toISOString(),
    };
  } catch (err) {
    throw err;
  }
}

export async function addUserToGroup(userId: string, groupId: string) {
  try {
    const result = await pool.query(
      `INSERT INTO users_groups (user_id, group_id)
       VALUES ($1, $2)`,
      [userId, groupId],
    );
    return result.rows.length;
  } catch (err) {
    throw err;
  }
}

export async function findGroupById(
  id: string,
): Promise<GroupRecord | undefined> {
  const result = await pool.query(
    `SELECT ${GROUP_SELECT_COLUMNS} FROM groups g WHERE g.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }
  return mapGroupRow(row);
}

export interface UpdateGroupFields {
  name?: string;
  seasonLength?: number;
}

export async function updateGroup(
  id: string,
  fields: UpdateGroupFields,
): Promise<GroupRecord | undefined> {
  const setClauses: string[] = [];
  const values: unknown[] = [id];

  if (fields.name !== undefined) {
    values.push(fields.name);
    setClauses.push(`name = $${values.length}`);
  }
  if (fields.seasonLength !== undefined) {
    values.push(fields.seasonLength);
    setClauses.push(`season_length = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return findGroupById(id);
  }

  const result = await pool.query(
    `UPDATE groups SET ${setClauses.join(", ")} WHERE id = $1
     RETURNING id`,
    values,
  );
  if (result.rowCount === 0) {
    return undefined;
  }
  return findGroupById(id);
}

export async function deleteGroup(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM groups WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listGroupsForUser(userId: string): Promise<GroupRecord[]> {
  const result = await pool.query(
    `SELECT ${GROUP_SELECT_COLUMNS} FROM groups g
     JOIN users_groups ug ON ug.group_id = g.id
     WHERE ug.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId],
  );
  return result.rows.map(mapGroupRow);
}

// --- Quest queries ---

export async function createQuest(
  id: string,
  groupId: string,
  creatorId: string,
  quest: CreateQuestRequestModel,
): Promise<CreateQuestResponseModel> {
  const { title, description, pointValue, dueAt } = quest;

  // TODO NEED STANDARDIZED STATUS
  const result = await pool.query(
    `INSERT INTO quests
       (id, group_id, creator_id, title, description, point_value, status, due_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'open', $7)
     RETURNING id, group_id, creator_id, title, description, point_value, due_at, created_at`,
    [id, groupId, creatorId, title, description, pointValue, dueAt],
  );
  const row = result.rows[0];
  return {
    id: row.id,
    groupId: row.group_id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    pointValue: row.point_value,
    dueAt: row.due_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

export async function listQuestsByGroup(
  groupId: string,
  status?: string,
): Promise<ListQuestsResponseModel> {
  //TODO implement better status query buidling
  const result = status
    ? await pool.query(
        `SELECT id, creator_id, title, point_value FROM quests WHERE group_id = $1 AND status = $2 ORDER BY created_at DESC`,
        [groupId, status],
      )
    : await pool.query(
        `SELECT id, creator_id, title, point_value FROM quests WHERE group_id = $1 ORDER BY created_at DESC`,
        [groupId],
      );
  return result.rows;
}

export async function findQuestById(
  questId: string,
): Promise<GetQuestResponseModel | null> {
  const result = await pool.query(
    `SELECT id, group_id, creator_id, title, description, point_value, status, due_at, completed_at, created_at
     FROM quests WHERE id = $1`,
    [questId],
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    groupId: row.group_id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    status: row.status,
    pointValue: row.point_value,
    dueAt: row.due_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

export async function updateQuest(
  questId: string,
  fields: Partial<
    Pick<
      QuestModel,
      "title" | "description" | "pointValue" | "status" | "dueAt"
    >
  >,
): Promise<UpdateQuestRequestModel | null> {
  const { title, description, pointValue, status, dueAt } = fields;

  const result = await pool.query(
    `UPDATE quests
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         point_value = COALESCE($4, point_value),
         status = COALESCE($5, status),
         due_at = COALESCE($6, due_at),
         completed_at = CASE WHEN $5 = 'completed' THEN now() ELSE completed_at END
     WHERE id = $1
     RETURNING id, creator_id AS "creatorId", title, description,
               point_value AS "pointValue", status, due_at AS "dueAt"`,
    [questId, title, description, pointValue, status, dueAt],
  );
  return result.rows[0] ?? null;
}

export async function deleteQuest(questId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM quests WHERE id = $1`, [
    questId,
  ]);
  return (result.rowCount ?? 0) > 0;
}
