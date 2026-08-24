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
  findUserCredentialsById as FindUserCredentialsByIdFn,
  updateUserFields as UpdateUserFieldsFn,
  DuplicateUsernameError as DuplicateUsernameErrorType,
  DuplicateUserError as DuplicateUserErrorType,
  pool as PoolType,
} from "../../db.js";
import type { app as AppType } from "../app.js";
import bcrypt from "bcrypt";

// Covers GET /users/:userId, PATCH /users/:userId, and GET /users/:userId/stats
// (user.handler.ts). PATCH /users/:userId is a single combined endpoint --
// any subset of username/newPassword/email can be set in one request,
// with currentPassword required whenever newPassword or email is
// present. Same structure as auth.test.ts: the unit suite mocks db.js so it
// never touches Postgres, and jest.mock() applies to this whole file's
// module registry -- not just one describe block -- so the integration
// suite re-requires everything fresh once the unit suite's afterAll has
// un-mocked it, via jest.resetModules() + require() instead of static
// imports for anything mock-sensitive.
describe("unit (mocked db)", () => {
  let getUser: typeof GetUserFn;
  let updateUser: typeof UpdateUserFn;
  let getUserStats: typeof GetUserStatsFn;
  let mockedFindUserById: jest.MockedFunction<typeof FindUserByIdFn>;
  let mockedFindUserCredentialsById: jest.MockedFunction<
    typeof FindUserCredentialsByIdFn
  >;
  let mockedUpdateUserFields: jest.MockedFunction<typeof UpdateUserFieldsFn>;
  let DuplicateUsernameError: typeof DuplicateUsernameErrorType;
  let DuplicateUserError: typeof DuplicateUserErrorType;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      findUserById: jest.fn(),
      findUserCredentialsById: jest.fn(),
      updateUserFields: jest.fn(),
      DuplicateUsernameError: class DuplicateUsernameError extends Error {},
      DuplicateUserError: class DuplicateUserError extends Error {},
    }));

    ({ getUser, updateUser, getUserStats } =
      require("../handlers/user.handler.js"));
    const db = require("../../db.js");

    mockedFindUserById = db.findUserById;
    mockedFindUserCredentialsById = db.findUserCredentialsById;
    mockedUpdateUserFields = db.updateUserFields;
    DuplicateUsernameError = db.DuplicateUsernameError;
    DuplicateUserError = db.DuplicateUserError;
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
    function updateUserRequest(
      userId: string,
      body: Record<string, unknown>,
      requesterId: string = userId,
    ) {
      return createMockRequest(body, { userId }, requesterId);
    }

    it("returns 401 UNAUTHORIZED when the requester isn't the account owner", async () => {
      const req = updateUserRequest(
        "user-1",
        { username: "newname" },
        "someone-else",
      );
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "UNAUTHORIZED" }),
        }),
      );
      expect(mockedUpdateUserFields).not.toHaveBeenCalled();
    });

    it("returns 400 VALIDATION_ERROR when no fields are provided", async () => {
      const req = updateUserRequest("user-1", {});
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
        }),
      );
    });

    it.each([
      { name: "too short", username: "ab" },
      { name: "too long", username: "a".repeat(21) },
    ])(
      "returns 400 VALIDATION_ERROR when the username is $name",
      async ({ username }) => {
        const req = updateUserRequest("user-1", { username });
        const res = createMockResponse();

        await updateUser(req as Parameters<typeof updateUser>[0], res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
          }),
        );
        expect(mockedUpdateUserFields).not.toHaveBeenCalled();
      },
    );

    it("returns 400 WEAK_PASSWORD when the new password is too short", async () => {
      const req = updateUserRequest("user-1", { newPassword: "short" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "WEAK_PASSWORD" }),
        }),
      );
      expect(mockedFindUserCredentialsById).not.toHaveBeenCalled();
    });

    it("returns 400 INVALID_EMAIL_FORMAT for a malformed email", async () => {
      const req = updateUserRequest("user-1", { email: "not-an-email" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INVALID_EMAIL_FORMAT" }),
        }),
      );
      expect(mockedFindUserCredentialsById).not.toHaveBeenCalled();
    });

    it("ignores the old newEmail field name -- email is left untouched", async () => {
      mockedUpdateUserFields.mockResolvedValue({
        id: "user-1",
        email: "original@example.com",
        username: "newname",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", {
        username: "newname",
        newEmail: "attacker@example.com",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      // newEmail isn't a field the handler reads at all, so it never
      // triggers the currentPassword requirement or reaches updateUserFields.
      expect(mockedFindUserCredentialsById).not.toHaveBeenCalled();
      expect(mockedUpdateUserFields).toHaveBeenCalledWith("user-1", {
        username: "newname",
        passwordHash: undefined,
        email: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 VALIDATION_ERROR when newPassword is given without currentPassword", async () => {
      const req = updateUserRequest("user-1", {
        newPassword: "brand-new-password-1",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
        }),
      );
      expect(mockedFindUserCredentialsById).not.toHaveBeenCalled();
    });

    it("returns 404 USER_NOT_FOUND when no user matches (username-only)", async () => {
      mockedUpdateUserFields.mockResolvedValue(undefined);

      const req = updateUserRequest("missing-user", { username: "newname" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
        }),
      );
    });

    it("returns 404 USER_NOT_FOUND when no user matches (password change)", async () => {
      mockedFindUserCredentialsById.mockResolvedValue(undefined);

      const req = updateUserRequest("missing-user", {
        currentPassword: "actual-password-1",
        newPassword: "brand-new-password-1",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
        }),
      );
    });

    it("returns 401 INVALID_CREDENTIALS when the current password is wrong", async () => {
      const storedHash = await bcrypt.hash("actual-password-1", 4);
      mockedFindUserCredentialsById.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: storedHash,
      });

      const req = updateUserRequest("user-1", {
        currentPassword: "wrong-password-1",
        newPassword: "brand-new-password-1",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INVALID_CREDENTIALS" }),
        }),
      );
      expect(mockedUpdateUserFields).not.toHaveBeenCalled();
    });

    it("returns 400 USERNAME_TAKEN when the username is already in use", async () => {
      mockedUpdateUserFields.mockRejectedValue(
        new DuplicateUsernameError("That username is already in use."),
      );

      const req = updateUserRequest("user-1", { username: "takenname" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "USERNAME_TAKEN" }),
        }),
      );
    });

    it("returns 409 EMAIL_ALREADY_EXISTS when the email is already in use", async () => {
      const storedHash = await bcrypt.hash("actual-password-1", 4);
      mockedFindUserCredentialsById.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: storedHash,
      });
      mockedUpdateUserFields.mockRejectedValue(
        new DuplicateUserError("An account with this email already exists."),
      );

      const req = updateUserRequest("user-1", {
        currentPassword: "actual-password-1",
        email: "taken@example.com",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "EMAIL_ALREADY_EXISTS" }),
        }),
      );
    });

    it("returns 500 INTERNAL_ERROR when the db fails unexpectedly", async () => {
      mockedUpdateUserFields.mockRejectedValue(new Error("connection lost"));

      const req = updateUserRequest("user-1", { username: "newname" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        }),
      );
    });

    it("returns 200 with the updated user when only the username changes", async () => {
      mockedUpdateUserFields.mockResolvedValue({
        id: "user-1",
        email: "a@example.com",
        username: "newname",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", { username: "newname" });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(mockedUpdateUserFields).toHaveBeenCalledWith("user-1", {
        username: "newname",
        passwordHash: undefined,
        email: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: "newname" }),
      );
    });

    it("verifies the current password and hashes the new one when changing password", async () => {
      const storedHash = await bcrypt.hash("actual-password-1", 4);
      mockedFindUserCredentialsById.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: storedHash,
      });
      mockedUpdateUserFields.mockResolvedValue({
        id: "user-1",
        email: "a@example.com",
        username: "abc123",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", {
        currentPassword: "actual-password-1",
        newPassword: "brand-new-password-1",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(mockedUpdateUserFields).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
      const [, fields] = mockedUpdateUserFields.mock.calls[0];
      await expect(
        bcrypt.compare("brand-new-password-1", fields.passwordHash!),
      ).resolves.toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 200 with the updated user when changing email", async () => {
      const storedHash = await bcrypt.hash("actual-password-1", 4);
      mockedFindUserCredentialsById.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: storedHash,
      });
      mockedUpdateUserFields.mockResolvedValue({
        id: "user-1",
        email: "new@example.com",
        username: "abc123",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", {
        currentPassword: "actual-password-1",
        email: "new@example.com",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(mockedUpdateUserFields).toHaveBeenCalledWith("user-1", {
        username: undefined,
        passwordHash: undefined,
        email: "new@example.com",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com" }),
      );
    });

    it("updates username, password, and email together in one call", async () => {
      const storedHash = await bcrypt.hash("actual-password-1", 4);
      mockedFindUserCredentialsById.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: storedHash,
      });
      mockedUpdateUserFields.mockResolvedValue({
        id: "user-1",
        email: "new@example.com",
        username: "newname",
        createdAt: new Date().toISOString(),
      });

      const req = updateUserRequest("user-1", {
        username: "newname",
        currentPassword: "actual-password-1",
        newPassword: "brand-new-password-1",
        email: "new@example.com",
      });
      const res = createMockResponse();

      await updateUser(req as Parameters<typeof updateUser>[0], res);

      expect(mockedUpdateUserFields).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          username: "newname",
          email: "new@example.com",
          passwordHash: expect.any(String),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
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
    return {
      ...user,
      id: res.body.id as string,
      token: res.body.authToken as string,
    };
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
        .set("Authorization", `Bearer ${user.token}`)
        .send({ username: newUsername });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, username: newUsername });

      const { rows } = await pool.query(
        "SELECT username FROM users WHERE id = $1",
        [user.id],
      );
      expect(rows[0]).toMatchObject({ username: newUsername });
    });

    it("changes the password so it can log in with the new one but not the old", async () => {
      const user = await registerUser();
      const newPassword = "brand-new-password-1";

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ currentPassword: user.password, newPassword });

      expect(res.status).toBe(200);

      const loginWithNew = await request(app)
        .post("/login")
        .send({ email: user.email, password: newPassword });
      expect(loginWithNew.status).toBe(200);

      const loginWithOld = await request(app)
        .post("/login")
        .send({ email: user.email, password: user.password });
      expect(loginWithOld.status).toBe(401);
    });

    it("changes the email and persists it to postgres", async () => {
      const user = await registerUser();
      const newEmail = `int-test-updated-${randomUUID().slice(0, 8)}@sidequest.test`;
      createdEmails.push(newEmail);

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ currentPassword: user.password, email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, email: newEmail });

      const { rows } = await pool.query(
        "SELECT email FROM users WHERE id = $1",
        [user.id],
      );
      expect(rows[0]).toMatchObject({ email: newEmail });
    });

    it("leaves the email unchanged when only the old newEmail field name is sent", async () => {
      const user = await registerUser();
      const newUsername = `updated_${randomUUID().slice(0, 8)}`;

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          username: newUsername,
          newEmail: "should-not-apply@sidequest.test",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.id,
        username: newUsername,
        email: user.email,
      });

      const { rows } = await pool.query(
        "SELECT email FROM users WHERE id = $1",
        [user.id],
      );
      expect(rows[0]).toMatchObject({ email: user.email });
    });

    it("updates username, password, and email together in one request", async () => {
      const user = await registerUser();
      const newUsername = `updated_${randomUUID().slice(0, 8)}`;
      const newPassword = "brand-new-password-1";
      const newEmail = `int-test-updated-${randomUUID().slice(0, 8)}@sidequest.test`;
      createdEmails.push(newEmail);

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          username: newUsername,
          currentPassword: user.password,
          newPassword,
          email: newEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.id,
        username: newUsername,
        email: newEmail,
      });

      const loginWithNew = await request(app)
        .post("/login")
        .send({ email: newEmail, password: newPassword });
      expect(loginWithNew.status).toBe(200);
    });

    it("returns 400 VALIDATION_ERROR when no fields are provided", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for a too-short username", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ username: "ab" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 USERNAME_TAKEN when the username is already in use", async () => {
      const userA = await registerUser();
      const userB = await registerUser();

      const res = await request(app)
        .patch(`/users/${userA.id}`)
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ username: userB.username });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("USERNAME_TAKEN");
    });

    it("returns 400 WEAK_PASSWORD for a too-short new password", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ currentPassword: user.password, newPassword: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEAK_PASSWORD");
    });

    it("returns 400 INVALID_EMAIL_FORMAT for a malformed email", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ currentPassword: user.password, email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_EMAIL_FORMAT");
    });

    it("returns 400 VALIDATION_ERROR when newPassword is given without currentPassword", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ newPassword: "brand-new-password-1" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 INVALID_CREDENTIALS when the current password is wrong", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          currentPassword: "wrong-password-1",
          newPassword: "brand-new-password-1",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 409 EMAIL_ALREADY_EXISTS when the email is already in use", async () => {
      const userA = await registerUser();
      const userB = await registerUser();

      const res = await request(app)
        .patch(`/users/${userA.id}`)
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ currentPassword: userA.password, email: userB.email });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("returns 401 UNAUTHORIZED when updating someone else's account", async () => {
      const userA = await registerUser();
      const userB = await registerUser();

      const res = await request(app)
        .patch(`/users/${userA.id}`)
        .set("Authorization", `Bearer ${userB.token}`)
        .send({ username: `hijacked_${randomUUID().slice(0, 8)}` });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when unauthenticated", async () => {
      const user = await registerUser();

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .send({ username: `nobody_${randomUUID().slice(0, 8)}` });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
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
