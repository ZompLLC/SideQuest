import request from "supertest";
import { randomUUID } from "crypto";
import { createMockRequest, createMockResponse } from "./testHelpers.js";
import type {
  getUser as GetUserFn,
  updateUser as UpdateUserFn,
  getUserStats as GetUserStatsFn,
} from "../handlers/user.handler.js";
import type {
  findUserById as FindUserByIdFn,
  updateUsername as UpdateUsernameFn,
  DuplicateUsernameError as DuplicateUsernameErrorType,
  pool as PoolType,
} from "../../db.js";
import type { app as AppType } from "../app.js";

// Covers GET /users/:userId, PATCH /users/:userId, and GET /users/:userId/stats
// (user.handler.ts). Same structure as auth.test.ts: the unit suite mocks
// db.js so it never touches Postgres, and jest.mock() applies to this whole
// file's module registry -- not just one describe block -- so the
// integration suite re-requires everything fresh once the unit suite's
// afterAll has un-mocked it, via jest.resetModules() + require() instead of
// static imports for anything mock-sensitive.
describe("unit (mocked db)", () => {
  let getUser: typeof GetUserFn;
  let updateUser: typeof UpdateUserFn;
  let getUserStats: typeof GetUserStatsFn;
  let mockedFindUserById: jest.MockedFunction<typeof FindUserByIdFn>;
  let mockedUpdateUsername: jest.MockedFunction<typeof UpdateUsernameFn>;
  let DuplicateUsernameError: typeof DuplicateUsernameErrorType;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      findUserById: jest.fn(),
      updateUsername: jest.fn(),
      DuplicateUsernameError: class DuplicateUsernameError extends Error {},
    }));

    ({ getUser, updateUser, getUserStats } = require("../handlers/user.handler.js"));
    const db = require("../../db.js");

    mockedFindUserById = db.findUserById;
    mockedUpdateUsername = db.updateUsername;
    DuplicateUsernameError = db.DuplicateUsernameError;
  });

  afterAll(() => {
    jest.dontMock("../../db.js");
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("returns 200 with the user on success", async () => {
      mockedFindUserById.mockResolvedValue({
        id: "user-1",
        email: "a@example.com",
        username: "abc123",
        createdAt: new Date().toISOString(),
      });

      const req = createMockRequest({}, { userId: "user-1" });
      const res = createMockResponse();

      await getUser(req as Parameters<typeof getUser>[0], res);

      expect(mockedFindUserById).toHaveBeenCalledWith("user-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "user-1", username: "abc123" }),
      );
    });

    it("returns 404 USER_NOT_FOUND when no user matches", async () => {
      mockedFindUserById.mockResolvedValue(undefined);

      const req = createMockRequest({}, { userId: "missing-user" });
      const res = createMockResponse();

      await getUser(req as Parameters<typeof getUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
        }),
      );
    });

    it("returns 500 INTERNAL_ERROR when the db fails unexpectedly", async () => {
      mockedFindUserById.mockRejectedValue(new Error("connection lost"));

      const req = createMockRequest({}, { userId: "user-1" });
      const res = createMockResponse();

      await getUser(req as Parameters<typeof getUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });
  });

  describe("updateUser", () => {
    function updateUserRequest(userId: string, username: unknown) {
      return createMockRequest({ username }, { userId });
    }

    it.each([
      { name: "too short", username: "ab" },
      { name: "too long", username: "a".repeat(21) },
    ])("returns 400 VALIDATION_ERROR when the username is $name", async ({ username }) => {
      const req = updateUserRequest("user-1", username);
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
        }),
      );
      expect(mockedUpdateUsername).not.toHaveBeenCalled();
    });

    it("returns 404 USER_NOT_FOUND when no user matches", async () => {
      mockedUpdateUsername.mockResolvedValue(undefined);

      const req = updateUserRequest("missing-user", "newname");
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
        }),
      );
    });

    it("returns 400 USERNAME_TAKEN when the username is already in use", async () => {
      mockedUpdateUsername.mockRejectedValue(
        new DuplicateUsernameError("That username is already in use."),
      );

      const req = updateUserRequest("user-1", "takenname");
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USERNAME_TAKEN" }),
        }),
      );
    });

    it("returns 500 INTERNAL_ERROR when the db fails unexpectedly", async () => {
      mockedUpdateUsername.mockRejectedValue(new Error("connection lost"));

      const req = updateUserRequest("user-1", "newname");
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 with the updated user on success", async () => {
      mockedUpdateUsername.mockResolvedValue({
        id: "user-1",
        email: "a@example.com",
        username: "newname",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", "newname");
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(mockedUpdateUsername).toHaveBeenCalledWith("user-1", "newname");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: "newname" }),
      );
    });
  });

  describe("getUserStats", () => {
    it("returns 200 with the mocked stats shape", () => {
      const req = createMockRequest({}, { userId: "user-1" });
      const res = createMockResponse();

      getUserStats(req as Parameters<typeof getUserStats>[0], res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: expect.any(Number),
          completionRate: expect.any(Number),
          totalPointsAllTime: expect.any(Number),
          badges: expect.any(Array),
          seasonHistory: expect.any(Array),
        }),
      );
    });
  });
});

// Hits the real Express app and the real local Postgres database configured
// via .env.test -- no mocking. Each test registers its own uniquely-suffixed
// user as a fixture (via the real POST /register) and cleans it up
// afterward so runs stay repeatable.
describe("integration (real Postgres)", () => {
  let app: typeof AppType;
  let pool: typeof PoolType;
  const createdEmails: string[] = [];

  beforeAll(() => {
    ({ app } = require("../app.js"));
    ({ pool } = require("../../db.js"));
  });

  afterEach(async () => {
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
    return { ...user, id: res.body.id as string };
  }

  describe("GET /users/:userId", () => {
    it("returns the persisted user", async () => {
      const user = await registerUser();

      const res = await request(app).get(`/users/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });

    it("returns 404 for a user that doesn't exist", async () => {
      const res = await request(app).get(`/users/${randomUUID()}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("PATCH /users/:userId", () => {
    it("updates the username and persists it to postgres", async () => {
      const user = await registerUser();
      const newUsername = `updated_${randomUUID().slice(0, 8)}`;

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .send({ username: newUsername });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, username: newUsername });

      const { rows } = await pool.query(
        "SELECT username FROM users WHERE id = $1",
        [user.id],
      );
      expect(rows[0]).toMatchObject({ username: newUsername });
    });

    it("returns 400 VALIDATION_ERROR for a too-short username", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .send({ username: "ab" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 USERNAME_TAKEN when the username is already in use", async () => {
      const userA = await registerUser();
      const userB = await registerUser();

      const res = await request(app)
        .patch(`/users/${userA.id}`)
        .send({ username: userB.username });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("USERNAME_TAKEN");
    });

    it("returns 404 for a user that doesn't exist", async () => {
      const res = await request(app)
        .patch(`/users/${randomUUID()}`)
        .send({ username: `nobody_${randomUUID().slice(0, 8)}` });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("GET /users/:userId/stats", () => {
    it("returns 200 with the mocked stats shape", async () => {
      const user = await registerUser();

      const res = await request(app).get(`/users/${user.id}/stats`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        currentStreak: expect.any(Number),
        completionRate: expect.any(Number),
        totalPointsAllTime: expect.any(Number),
        badges: expect.any(Array),
        seasonHistory: expect.any(Array),
      });
    });
  });
});
