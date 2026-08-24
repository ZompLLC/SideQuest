import request from "supertest";
import { randomUUID } from "crypto";
import { createMockRequest, createMockResponse } from "./testHelpers.js";
import type {
  createQuest as CreateQuestFn,
  listQuests as ListQuestsFn,
  getQuest as GetQuestFn,
  updateQuest as UpdateQuestFn,
  deleteQuest as DeleteQuestFn,
} from "../handlers/quest.handler.js";
import type {
  createQuest as CreateQuestDbFn,
  listQuestsByGroup as ListQuestsByGroupFn,
  findQuestById as FindQuestByIdFn,
  updateQuest as UpdateQuestDbFn,
  deleteQuest as DeleteQuestDbFn,
  findGroupById as FindGroupByIdFn,
  pool as PoolType,
} from "../../db.js";
import type { app as AppType } from "../app.js";

// Covers POST/GET/PATCH/DELETE /groups/:groupId/quests[/:questId]
// (quest.handler.ts). Same structure as group.test.ts: the unit suite mocks
// db.js so it never touches Postgres, and jest.mock() applies to this whole
// file's module registry -- not just one describe block -- so both suites
// use jest.resetModules() + require() instead of static imports for
// anything mock-sensitive, letting the integration suite re-require the
// REAL db.js once the unit suite's afterAll has un-mocked it.
describe("unit (mocked db)", () => {
  let createQuest: typeof CreateQuestFn;
  let listQuests: typeof ListQuestsFn;
  let getQuest: typeof GetQuestFn;
  let updateQuest: typeof UpdateQuestFn;
  let deleteQuest: typeof DeleteQuestFn;
  let mockedCreateQuest: jest.MockedFunction<typeof CreateQuestDbFn>;
  let mockedListQuestsByGroup: jest.MockedFunction<typeof ListQuestsByGroupFn>;
  let mockedFindQuestById: jest.MockedFunction<typeof FindQuestByIdFn>;
  let mockedUpdateQuest: jest.MockedFunction<typeof UpdateQuestDbFn>;
  let mockedDeleteQuest: jest.MockedFunction<typeof DeleteQuestDbFn>;
  let mockedFindGroupById: jest.MockedFunction<typeof FindGroupByIdFn>;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      createQuest: jest.fn(),
      listQuestsByGroup: jest.fn(),
      findQuestById: jest.fn(),
      updateQuest: jest.fn(),
      deleteQuest: jest.fn(),
      findGroupById: jest.fn(),
    }));

    ({ createQuest, listQuests, getQuest, updateQuest, deleteQuest } =
      require("../handlers/quest.handler.js"));
    const db = require("../../db.js");

    mockedCreateQuest = db.createQuest;
    mockedListQuestsByGroup = db.listQuestsByGroup;
    mockedFindQuestById = db.findQuestById;
    mockedUpdateQuest = db.updateQuest;
    mockedDeleteQuest = db.deleteQuest;
    mockedFindGroupById = db.findGroupById;
  });

  afterAll(() => {
    jest.dontMock("../../db.js");
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleQuestBody = {
    title: "5K Run",
    description: "Run 5 kilometers",
    pointValue: 20,
    dueAt: "2026-09-01T00:00:00.000Z",
  };

  function sampleGroup(overrides: Partial<{ id: string }> = {}) {
    return {
      id: overrides.id ?? "group-1",
      name: "Study Buddies",
      ownerId: "owner-1",
      inviteCode: "abc123",
      memberCount: 1,
      seasonLength: 30,
      createdAt: new Date().toISOString(),
    };
  }

  function sampleQuest(overrides: Record<string, unknown> = {}) {
    return {
      id: "quest-1",
      groupId: "group-1",
      creatorId: "user-1",
      title: "5K Run",
      description: "Run 5 kilometers",
      pointValue: 20,
      status: "open",
      dueAt: "2026-09-01T00:00:00.000Z",
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  describe("createQuest", () => {
    it("returns 400 VALIDATION_ERROR when a required field is missing", async () => {
      const req = createMockRequest(
        { title: "5K Run" },
        { groupId: "group-1" },
        "user-1",
      );
      const res = createMockResponse();

      await createQuest(req as Parameters<typeof createQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
        }),
      );
      expect(mockedFindGroupById).not.toHaveBeenCalled();
    });

    it("returns 404 GROUP_NOT_FOUND when the group doesn't exist", async () => {
      mockedFindGroupById.mockResolvedValue(undefined);

      const req = createMockRequest(sampleQuestBody, { groupId: "group-1" }, "user-1");
      const res = createMockResponse();

      await createQuest(req as Parameters<typeof createQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "GROUP_NOT_FOUND" }),
        }),
      );
      expect(mockedCreateQuest).not.toHaveBeenCalled();
    });

    it("returns 500 INTERNAL_ERROR when looking up the group fails", async () => {
      mockedFindGroupById.mockRejectedValue(new Error("connection lost"));

      const req = createMockRequest(sampleQuestBody, { groupId: "group-1" }, "user-1");
      const res = createMockResponse();

      await createQuest(req as Parameters<typeof createQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 500 INTERNAL_ERROR when the db fails to create the quest", async () => {
      mockedFindGroupById.mockResolvedValue(sampleGroup());
      mockedCreateQuest.mockRejectedValue(new Error("connection lost"));

      const req = createMockRequest(sampleQuestBody, { groupId: "group-1" }, "user-1");
      const res = createMockResponse();

      await createQuest(req as Parameters<typeof createQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 201 with the created quest on success", async () => {
      mockedFindGroupById.mockResolvedValue(sampleGroup());
      mockedCreateQuest.mockResolvedValue({
        id: "quest-1",
        groupId: "group-1",
        creatorId: "user-1",
        title: sampleQuestBody.title,
        description: sampleQuestBody.description,
        pointValue: sampleQuestBody.pointValue,
        dueAt: sampleQuestBody.dueAt,
        createdAt: new Date().toISOString(),
      });

      const req = createMockRequest(sampleQuestBody, { groupId: "group-1" }, "user-1");
      const res = createMockResponse();

      await createQuest(req as Parameters<typeof createQuest>[0], res);

      expect(mockedCreateQuest).toHaveBeenCalledWith(
        expect.any(String),
        "group-1",
        "user-1",
        sampleQuestBody,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: sampleQuestBody.title }),
      );
    });
  });

  describe("listQuests", () => {
    it("returns 404 GROUP_NOT_FOUND when the group doesn't exist", async () => {
      mockedFindGroupById.mockResolvedValue(undefined);

      const req = createMockRequest({}, { groupId: "group-1" });
      const res = createMockResponse();

      await listQuests(req as Parameters<typeof listQuests>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "GROUP_NOT_FOUND" }),
        }),
      );
      expect(mockedListQuestsByGroup).not.toHaveBeenCalled();
    });

    it("returns 500 INTERNAL_ERROR when listing quests fails", async () => {
      mockedFindGroupById.mockResolvedValue(sampleGroup());
      mockedListQuestsByGroup.mockRejectedValue(new Error("connection lost"));

      const req = createMockRequest({}, { groupId: "group-1" });
      const res = createMockResponse();

      await listQuests(req as Parameters<typeof listQuests>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 with the quest list on success", async () => {
      mockedFindGroupById.mockResolvedValue(sampleGroup());
      mockedListQuestsByGroup.mockResolvedValue([
        { id: "quest-1", creatorId: "user-1", title: "5K Run", pointValue: 20 },
      ]);

      const req = createMockRequest({}, { groupId: "group-1" });
      const res = createMockResponse();

      await listQuests(req as Parameters<typeof listQuests>[0], res);

      expect(mockedListQuestsByGroup).toHaveBeenCalledWith("group-1", undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "quest-1", title: "5K Run" }),
      ]);
    });

    it("passes the status query param through to the db call", async () => {
      mockedFindGroupById.mockResolvedValue(sampleGroup());
      mockedListQuestsByGroup.mockResolvedValue([]);

      const req = createMockRequest({}, { groupId: "group-1" }, undefined, {
        status: "completed",
      });
      const res = createMockResponse();

      await listQuests(req as Parameters<typeof listQuests>[0], res);

      expect(mockedListQuestsByGroup).toHaveBeenCalledWith(
        "group-1",
        "completed",
      );
    });
  });

  describe("getQuest", () => {
    it("returns 404 QUEST_NOT_FOUND when no quest matches", async () => {
      mockedFindQuestById.mockResolvedValue(null);

      const req = createMockRequest(
        {},
        { groupId: "group-1", questId: "quest-1" },
      );
      const res = createMockResponse();

      await getQuest(req as Parameters<typeof getQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUEST_NOT_FOUND" }),
        }),
      );
    });

    it("returns 404 QUEST_NOT_FOUND when the quest belongs to a different group", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ groupId: "other-group" }));

      const req = createMockRequest(
        {},
        { groupId: "group-1", questId: "quest-1" },
      );
      const res = createMockResponse();

      await getQuest(req as Parameters<typeof getQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUEST_NOT_FOUND" }),
        }),
      );
    });

    it("returns 500 INTERNAL_ERROR when the db fails unexpectedly", async () => {
      mockedFindQuestById.mockRejectedValue(new Error("connection lost"));

      const req = createMockRequest(
        {},
        { groupId: "group-1", questId: "quest-1" },
      );
      const res = createMockResponse();

      await getQuest(req as Parameters<typeof getQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 with the quest on success", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest());

      const req = createMockRequest(
        {},
        { groupId: "group-1", questId: "quest-1" },
      );
      const res = createMockResponse();

      await getQuest(req as Parameters<typeof getQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "quest-1", title: "5K Run" }),
      );
    });
  });

  describe("updateQuest", () => {
    function updateRequest(
      body: Record<string, unknown>,
      requesterId = "user-1",
    ) {
      return createMockRequest(
        body,
        { groupId: "group-1", questId: "quest-1" },
        requesterId,
      );
    }

    it("returns 404 QUEST_NOT_FOUND when no quest matches", async () => {
      mockedFindQuestById.mockResolvedValue(null);

      const req = updateRequest({ title: "New title" });
      const res = createMockResponse();

      await updateQuest(req as Parameters<typeof updateQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUEST_NOT_FOUND" }),
        }),
      );
      expect(mockedUpdateQuest).not.toHaveBeenCalled();
    });

    it("returns 404 QUEST_NOT_FOUND when the quest belongs to a different group", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ groupId: "other-group" }));

      const req = updateRequest({ title: "New title" });
      const res = createMockResponse();

      await updateQuest(req as Parameters<typeof updateQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUEST_NOT_FOUND" }),
        }),
      );
    });

    it("returns 403 NOT_QUEST_OWNER when the requester isn't the creator", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));

      const req = updateRequest({ title: "New title" }, "someone-else");
      const res = createMockResponse();

      await updateQuest(req as Parameters<typeof updateQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_QUEST_OWNER" }),
        }),
      );
      expect(mockedUpdateQuest).not.toHaveBeenCalled();
    });

    it("returns 500 INTERNAL_ERROR when the db fails to update", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));
      mockedUpdateQuest.mockRejectedValue(new Error("connection lost"));

      const req = updateRequest({ title: "New title" });
      const res = createMockResponse();

      await updateQuest(req as Parameters<typeof updateQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 with the updated quest on success", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));
      mockedUpdateQuest.mockResolvedValue({ title: "New title" });

      const req = updateRequest({ title: "New title" });
      const res = createMockResponse();

      await updateQuest(req as Parameters<typeof updateQuest>[0], res);

      expect(mockedUpdateQuest).toHaveBeenCalledWith(
        "quest-1",
        expect.objectContaining({ title: "New title" }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New title" }),
      );
    });
  });

  describe("deleteQuest", () => {
    function deleteRequest(requesterId = "user-1") {
      return createMockRequest(
        {},
        { groupId: "group-1", questId: "quest-1" },
        requesterId,
      );
    }

    it("returns 404 QUEST_NOT_FOUND when no quest matches", async () => {
      mockedFindQuestById.mockResolvedValue(null);

      const req = deleteRequest();
      const res = createMockResponse();

      await deleteQuest(req as Parameters<typeof deleteQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUEST_NOT_FOUND" }),
        }),
      );
      expect(mockedDeleteQuest).not.toHaveBeenCalled();
    });

    it("returns 403 NOT_QUEST_OWNER when the requester isn't the creator", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));

      const req = deleteRequest("someone-else");
      const res = createMockResponse();

      await deleteQuest(req as Parameters<typeof deleteQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_QUEST_OWNER" }),
        }),
      );
      expect(mockedDeleteQuest).not.toHaveBeenCalled();
    });

    it("returns 500 INTERNAL_ERROR when the db fails to delete", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));
      mockedDeleteQuest.mockRejectedValue(new Error("connection lost"));

      const req = deleteRequest();
      const res = createMockResponse();

      await deleteQuest(req as Parameters<typeof deleteQuest>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 on success", async () => {
      mockedFindQuestById.mockResolvedValue(sampleQuest({ creatorId: "user-1" }));
      mockedDeleteQuest.mockResolvedValue(true);

      const req = deleteRequest();
      const res = createMockResponse();

      await deleteQuest(req as Parameters<typeof deleteQuest>[0], res);

      expect(mockedDeleteQuest).toHaveBeenCalledWith("quest-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });
  });
});

// Hits the real Express app and the real local Postgres database configured
// via .env.test -- no mocking. Each test registers its own real user (via
// POST /register) to get a JWT and creates its own real group (via
// POST /groups) to scope quests to. Neither the groups table nor the
// quests table declares any foreign keys (not even without cascade), so
// unlike users_groups, nothing here is cleaned up automatically -- created
// quests, groups, and users are all tracked and deleted explicitly.
describe("integration (real Postgres)", () => {
  let app: typeof AppType;
  let pool: typeof PoolType;
  const createdEmails: string[] = [];
  const createdGroupIds: string[] = [];
  const createdQuestIds: string[] = [];

  beforeAll(() => {
    ({ app } = require("../app.js"));
    ({ pool } = require("../../db.js"));
  });

  afterEach(async () => {
    if (createdQuestIds.length > 0) {
      await pool.query("DELETE FROM quests WHERE id = ANY($1)", [
        createdQuestIds,
      ]);
      createdQuestIds.length = 0;
    }
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

  async function createGroupFixture(token: string) {
    const res = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `int-test-group-${randomUUID().slice(0, 8)}` })
      .expect(201);
    createdGroupIds.push(res.body.id);
    return res.body.id as string;
  }

  async function createQuestFixture(
    groupId: string,
    token: string,
    overrides: Record<string, unknown> = {},
  ) {
    const res = await request(app)
      .post(`/groups/${groupId}/quests`)
      .set("Authorization", `Bearer ${token}`)
      .send(questBody(overrides))
      .expect(201);
    createdQuestIds.push(res.body.id);
    return res.body.id as string;
  }

  function questBody(overrides: Record<string, unknown> = {}) {
    return {
      title: "5K Run",
      description: "Run 5 kilometers",
      pointValue: 20,
      dueAt: "2026-09-01T00:00:00.000Z",
      ...overrides,
    };
  }

  describe("POST /groups/:groupId/quests", () => {
    it("creates a new quest and persists it to postgres", async () => {
      const { userId, token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app)
        .post(`/groups/${groupId}/quests`)
        .set("Authorization", `Bearer ${token}`)
        .send(questBody());

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        groupId,
        creatorId: userId,
        title: "5K Run",
        pointValue: 20,
      });
      expect(typeof res.body.id).toBe("string");
      createdQuestIds.push(res.body.id);

      const { rows } = await pool.query(
        "SELECT title, point_value, status FROM quests WHERE id = $1",
        [res.body.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        title: "5K Run",
        point_value: 20,
        status: "open",
      });
    });

    it("rejects missing fields with 400", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app)
        .post(`/groups/${groupId}/quests`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "5K Run" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 for a group that doesn't exist", async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .post(`/groups/${randomUUID()}/quests`)
        .set("Authorization", `Bearer ${token}`)
        .send(questBody());

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("GROUP_NOT_FOUND");
    });

    it("returns 401 when unauthenticated", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app)
        .post(`/groups/${groupId}/quests`)
        .send(questBody());

      expect(res.status).toBe(401);
    });
  });

  describe("GET /groups/:groupId/quests and /:questId", () => {
    it("lists quests created in the group", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      await createQuestFixture(groupId, token, { title: "Quest A" });
      await createQuestFixture(groupId, token, { title: "Quest B" });

      const res = await request(app).get(`/groups/${groupId}/quests`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((q: { title: string }) => q.title).sort()).toEqual([
        "Quest A",
        "Quest B",
      ]);
    });

    it("returns 404 for a group that doesn't exist", async () => {
      const res = await request(app).get(`/groups/${randomUUID()}/quests`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("GROUP_NOT_FOUND");
    });

    it("gets a single quest by id", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app).get(
        `/groups/${groupId}/quests/${questId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: questId, title: "5K Run" });
    });

    it("returns 404 for a quest that doesn't exist", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app).get(
        `/groups/${groupId}/quests/${randomUUID()}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("QUEST_NOT_FOUND");
    });

    it("returns 404 when the quest belongs to a different group", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const otherGroupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app).get(
        `/groups/${otherGroupId}/quests/${questId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("QUEST_NOT_FOUND");
    });
  });

  describe("PATCH /groups/:groupId/quests/:questId", () => {
    it("updates the quest as its creator", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app)
        .patch(`/groups/${groupId}/quests/${questId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated title", status: "completed" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        title: "Updated title",
        status: "completed",
      });

      const { rows } = await pool.query(
        "SELECT title, status, completed_at FROM quests WHERE id = $1",
        [questId],
      );
      expect(rows[0].title).toBe("Updated title");
      expect(rows[0].status).toBe("completed");
      expect(rows[0].completed_at).not.toBeNull();
    });

    it("returns 403 when a non-creator tries to update it", async () => {
      const { token: ownerToken } = await registerUser();
      const { token: otherToken } = await registerUser();
      const groupId = await createGroupFixture(ownerToken);
      const questId = await createQuestFixture(groupId, ownerToken);

      const res = await request(app)
        .patch(`/groups/${groupId}/quests/${questId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ title: "Hijacked" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("NOT_QUEST_OWNER");
    });

    it("returns 404 for a quest that doesn't exist", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app)
        .patch(`/groups/${groupId}/quests/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New title" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("QUEST_NOT_FOUND");
    });

    it("returns 401 when unauthenticated", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app)
        .patch(`/groups/${groupId}/quests/${questId}`)
        .send({ title: "New title" });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /groups/:groupId/quests/:questId", () => {
    it("deletes the quest as its creator", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app)
        .delete(`/groups/${groupId}/quests/${questId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const { rows } = await pool.query(
        "SELECT id FROM quests WHERE id = $1",
        [questId],
      );
      expect(rows).toHaveLength(0);
    });

    it("returns 403 when a non-creator tries to delete it", async () => {
      const { token: ownerToken } = await registerUser();
      const { token: otherToken } = await registerUser();
      const groupId = await createGroupFixture(ownerToken);
      const questId = await createQuestFixture(groupId, ownerToken);

      const res = await request(app)
        .delete(`/groups/${groupId}/quests/${questId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("NOT_QUEST_OWNER");
    });

    it("returns 404 for a quest that doesn't exist", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);

      const res = await request(app)
        .delete(`/groups/${groupId}/quests/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("QUEST_NOT_FOUND");
    });

    it("returns 401 when unauthenticated", async () => {
      const { token } = await registerUser();
      const groupId = await createGroupFixture(token);
      const questId = await createQuestFixture(groupId, token);

      const res = await request(app).delete(
        `/groups/${groupId}/quests/${questId}`,
      );

      expect(res.status).toBe(401);
    });
  });
});
