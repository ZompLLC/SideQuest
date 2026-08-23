import request from "supertest";
import { randomUUID } from "crypto";
import { createMockRequest, createMockResponse } from "./testHelpers.js";
import type { createGroup as CreateGroupHandlerFn } from "../handlers/group.handler.js";
import type { createGroup as CreateGroupDbFn, pool as PoolType } from "../../db.js";
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

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      createGroup: jest.fn(),
      findGroupById: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
    }));

    ({ createGroup } = require("../handlers/group.handler.js"));
    const db = require("../../db.js");
    mockedCreateGroup = db.createGroup;
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

  it("creates a group and returns 201 on success", async () => {
    mockedCreateGroup.mockResolvedValue({
      id: "group-1",
      name: "Study Buddies",
      ownerId: "aeca1f42-a965-415f-9f81-4dec0a76e14",
      inviteCode: "abc123",
      memberCount: 1,
      seasonLength: 30,
      createdAt: new Date().toISOString(),
    });

    const req = createMockRequest({ name: "Study Buddies" });
    const res = createMockResponse();

    await createGroup(req as Parameters<typeof createGroup>[0], res);

    expect(mockedCreateGroup).toHaveBeenCalledWith(
      expect.any(String),
      "Study Buddies",
      "aeca1f42-a965-415f-9f81-4dec0a76e14",
      expect.any(String),
      30,
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
// via .env.test -- no mocking. Each test cleans up the groups it creates so
// runs stay repeatable. group.handler.ts hardcodes the owner id (no auth
// wired up yet -- see its "TODO get auth user" comment), and groups.owner_id
// has no foreign-key constraint, so no user needs to exist first.
describe("integration (real Postgres)", () => {
  let app: typeof AppType;
  let pool: typeof PoolType;
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
  });

  afterAll(async () => {
    await pool.end();
  });

  function uniqueGroupName() {
    return `int-test-group-${randomUUID().slice(0, 8)}`;
  }

  it("creates a new group and persists it to postgres", async () => {
    const name = uniqueGroupName();

    const res = await request(app).post("/groups").send({ name });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name,
      seasonLength: 30,
    });
    expect(typeof res.body.id).toBe("string");
    expect(typeof res.body.inviteCode).toBe("string");
    createdGroupIds.push(res.body.id);

    const { rows } = await pool.query(
      "SELECT name, season_length, member_count FROM groups WHERE id = $1",
      [res.body.id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name,
      season_length: 30,
      member_count: 1,
    });
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app).post("/groups").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
