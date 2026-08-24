import request from "supertest";
import { randomUUID } from "crypto";
import { createMockRequest, createMockResponse } from "./testHelpers.js";
import type { createGroup as CreateGroupHandlerFn } from "../handlers/group.handler.js";
import type {
  createGroup as CreateGroupDbFn,
  addUserToGroup as AddUserToGroupFn,
  pool as PoolType,
} from "../../db.js";
import type { app as AppType } from "../app.js";

// Mirrors auth.test.ts's structure: the unit suite mocks db.js so it never
// touches Postgres, and jest.mock() applies to the whole file's module
// registry -- not just one describe block -- so both suites use
// jest.resetModules() + require() instead of static imports for anything
// mock-sensitive, letting the integration suite re-require the REAL db.js
// once the unit suite's afterAll has un-mocked it.
describe("unit (mocked db)", () => {
  let createGroup: typeof CreateGroupHandlerFn;
  let mockedCreateGroup: jest.MockedFunction<typeof CreateGroupDbFn>;
  let mockedAddUserToGroup: jest.MockedFunction<typeof AddUserToGroupFn>;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      createGroup: jest.fn(),
      findGroupById: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      addUserToGroup: jest.fn(),
    }));

    ({ createGroup } = require("../handlers/group.handler.js"));
    const db = require("../../db.js");
    mockedCreateGroup = db.createGroup;
    mockedAddUserToGroup = db.addUserToGroup;
  });

  afterAll(() => {
    jest.dontMock("../../db.js");
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 VALIDATION_ERROR when name is missing", async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await createGroup(req as Parameters<typeof createGroup>[0], res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
    expect(mockedCreateGroup).not.toHaveBeenCalled();
  });

  it("creates a group, adds the owner to it, and returns 201 on success", async () => {
    const userId = "user-1";
    mockedCreateGroup.mockResolvedValue({
      id: "group-1",
      name: "Study Buddies",
      ownerId: userId,
      inviteCode: "abc123",
      memberCount: 1,
      seasonLength: 30,
      createdAt: new Date().toISOString(),
    });
    mockedAddUserToGroup.mockResolvedValue(1);

    const req = createMockRequest({ name: "Study Buddies" }, {}, userId);
    const res = createMockResponse();

    await createGroup(req as Parameters<typeof createGroup>[0], res);

    expect(mockedCreateGroup).toHaveBeenCalledWith(
      expect.any(String),
      "Study Buddies",
      userId,
      expect.any(String),
      30,
    );
    const groupIdPassedToCreateGroup = mockedCreateGroup.mock.calls[0][0];
    expect(mockedAddUserToGroup).toHaveBeenCalledWith(
      userId,
      groupIdPassedToCreateGroup,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Study Buddies",
        seasonLength: 30,
      }),
    );
  });

  it("returns 500 INTERNAL_ERROR when the db fails unexpectedly", async () => {
    mockedCreateGroup.mockRejectedValue(new Error("connection lost"));

    const req = createMockRequest({ name: "Study Buddies" });
    const res = createMockResponse();

    await createGroup(req as Parameters<typeof createGroup>[0], res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
      }),
    );
  });
});

// Hits the real Express app and the real local Postgres database configured
// via .env.test -- no mocking. POST /groups requires auth, so each test
// registers its own real user (via POST /register) to get a JWT. Deleting
// that user in afterEach cascades away any group/users_groups rows it
// created too (both have ON DELETE CASCADE foreign keys to users.id).
describe("integration (real Postgres)", () => {
  let app: typeof AppType;
  let pool: typeof PoolType;
  const createdEmails: string[] = [];
  const createdGroupIds: string[] = [];

  beforeAll(() => {
    ({ app } = require("../app.js"));
    ({ pool } = require("../../db.js"));
  });

  afterEach(async () => {
    if (createdGroupIds.length > 0) {
      await pool.query("DELETE FROM groups WHERE id = ANY($1)", [
        createdGroupIds,
      ]);
      createdGroupIds.length = 0;
    }
    if (createdEmails.length > 0) {
      await pool.query("DELETE FROM users WHERE email = ANY($1)", [
        createdEmails,
      ]);
      createdEmails.length = 0;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  function uniqueGroupName() {
    return `int-test-group-${randomUUID().slice(0, 8)}`;
  }

  async function registerUser() {
    const suffix = randomUUID().slice(0, 8);
    const user = {
      email: `int-test-${suffix}@sidequest.test`,
      username: `inttest_${suffix}`,
      password: "correct-horse-battery-1",
    };
    createdEmails.push(user.email);

    const res = await request(app).post("/register").send(user).expect(201);
    return { userId: res.body.id as string, token: res.body.authToken as string };
  }

  it("creates a new group, adds the owner to it, and persists both to postgres", async () => {
    const { userId, token } = await registerUser();
    const name = uniqueGroupName();

    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({ name });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name,
      ownerId: userId,
      seasonLength: 30,
    });
    expect(typeof res.body.id).toBe("string");
    expect(typeof res.body.inviteCode).toBe("string");
    createdGroupIds.push(res.body.id);

    const { rows: groupRows } = await pool.query(
      "SELECT name, season_length, member_count FROM groups WHERE id = $1",
      [res.body.id],
    );
    expect(groupRows).toHaveLength(1);
    expect(groupRows[0]).toMatchObject({
      name,
      season_length: 30,
      member_count: 1,
    });

    const { rows: membershipRows } = await pool.query(
      "SELECT user_id, group_id FROM users_groups WHERE group_id = $1",
      [res.body.id],
    );
    expect(membershipRows).toHaveLength(1);
    expect(membershipRows[0]).toMatchObject({
      user_id: userId,
      group_id: res.body.id,
    });
  });

  it("rejects missing fields with 400", async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/groups")
      .send({ name: uniqueGroupName() });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
