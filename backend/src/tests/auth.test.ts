import request from "supertest";
import { randomUUID } from "crypto";
import { createMockRequest, createMockResponse } from "./testHelpers.js";
import type { register as RegisterFn, login as LoginFn } from "../handlers/auth.handler.js";
import type {
  createUser as CreateUserFn,
  findUserByEmail as FindUserByEmailFn,
  DuplicateUsernameError as DuplicateUsernameErrorType,
  DuplicateUserError as DuplicateUserErrorType,
  pool as PoolType,
} from "../../db.js";
import type { app as AppType } from "../app.js";
import type bcryptType from "bcrypt";
import type jwtType from "jsonwebtoken";

type ErrorCase = {
  name: string;
  body: Record<string, unknown>;
  setup?: () => void;
  after?: () => void;
  expectedStatus: number;
  expectedCode: string;
};

// The unit suite below mocks db/bcrypt/jsonwebtoken so it never touches
// Postgres. jest.mock() applies to this whole file's module registry, not
// just one describe block, so the integration suite -- which needs the
// REAL implementations -- resets and re-requires everything fresh in its
// own beforeAll once the unit suite's afterAll has un-mocked them. That's
// why both suites use dynamic require() instead of static imports for
// anything mock-sensitive.
describe("unit (mocked db/bcrypt/jwt)", () => {
  let register: typeof RegisterFn;
  let login: typeof LoginFn;
  let mockedCreateUser: jest.MockedFunction<typeof CreateUserFn>;
  let mockedFindUserByEmail: jest.MockedFunction<typeof FindUserByEmailFn>;
  let mockedBcryptHash: jest.MockedFunction<typeof bcryptType.hash>;
  let mockedBcryptCompare: jest.MockedFunction<typeof bcryptType.compare>;
  let mockedJwtSign: jest.MockedFunction<typeof jwtType.sign>;
  let DuplicateUsernameError: typeof DuplicateUsernameErrorType;
  let DuplicateUserError: typeof DuplicateUserErrorType;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../../db.js", () => ({
      createUser: jest.fn(),
      findUserByEmail: jest.fn(),
      DuplicateUsernameError: class DuplicateUsernameError extends Error {},
      DuplicateUserError: class DuplicateUserError extends Error {},
    }));
    jest.doMock("bcrypt", () => ({ hash: jest.fn(), compare: jest.fn() }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn() }));

    ({ register, login } = require("../handlers/auth.handler.js"));
    const db = require("../../db.js");
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");

    mockedCreateUser = db.createUser;
    mockedFindUserByEmail = db.findUserByEmail;
    DuplicateUsernameError = db.DuplicateUsernameError;
    DuplicateUserError = db.DuplicateUserError;
    mockedBcryptHash = bcrypt.hash;
    mockedBcryptCompare = bcrypt.compare;
    mockedJwtSign = jwt.sign;
  });

  afterAll(() => {
    jest.dontMock("../../db.js");
    jest.dontMock("bcrypt");
    jest.dontMock("jsonwebtoken");
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it.each([
      {
        name: "required fields are missing",
        body: { email: "a@example.com" },
        after: () => expect(mockedCreateUser).not.toHaveBeenCalled(),
        expectedStatus: 400,
        expectedCode: "VALIDATION_ERROR",
      },
      {
        name: "the password is shorter than 8 characters",
        body: {
          email: "a@example.com",
          username: "abc123",
          password: "short",
        },
        after: () => expect(mockedCreateUser).not.toHaveBeenCalled(),
        expectedStatus: 400,
        expectedCode: "WEAK_PASSWORD",
      },
      {
        name: "the username is already in use",
        body: {
          email: "a@example.com",
          username: "abc123",
          password: "longenough1",
        },
        setup: () => {
          mockedBcryptHash.mockResolvedValue("hashed-password" as never);
          mockedCreateUser.mockRejectedValue(
            new DuplicateUsernameError("That username is already taken."),
          );
        },
        expectedStatus: 400,
        expectedCode: "USERNAME_TAKEN",
      },
      {
        name: "the email is already registered",
        body: {
          email: "a@example.com",
          username: "abc123",
          password: "longenough1",
        },
        setup: () => {
          mockedBcryptHash.mockResolvedValue("hashed-password" as never);
          mockedCreateUser.mockRejectedValue(
            new DuplicateUserError(
              "An account with this email already exists.",
            ),
          );
        },
        expectedStatus: 409,
        expectedCode: "EMAIL_ALREADY_EXISTS",
      },
      {
        name: "the db fails unexpectedly",
        body: {
          email: "a@example.com",
          username: "abc123",
          password: "longenough1",
        },
        setup: () => {
          mockedBcryptHash.mockResolvedValue("hashed-password" as never);
          mockedCreateUser.mockRejectedValue(new Error("connection lost"));
        },
        expectedStatus: 500,
        expectedCode: "INTERNAL_ERROR",
      },
    ] satisfies ErrorCase[])(
      "returns $expectedStatus $expectedCode when $name",
      async ({ body, setup, after, expectedStatus, expectedCode }) => {
        setup?.();
        const req = createMockRequest(body);
        const res = createMockResponse();

        await register(req as Parameters<typeof register>[0], res);

        expect(res.status).toHaveBeenCalledWith(expectedStatus);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({ code: expectedCode }),
          }),
        );
        after?.();
      },
    );

    it("creates a user and returns 201 with an auth token on success", async () => {
      mockedBcryptHash.mockResolvedValue("hashed-password" as never);
      mockedCreateUser.mockResolvedValue({
        id: "user-1",
        email: "a@example.com",
        username: "abc123",
        createdAt: new Date().toISOString(),
      });
      mockedJwtSign.mockReturnValue("signed-token" as never);

      const req = createMockRequest({
        email: "a@example.com",
        username: "abc123",
        password: "longenough1",
      });
      const res = createMockResponse();

      await register(req as Parameters<typeof register>[0], res);

      expect(mockedCreateUser).toHaveBeenCalledWith(
        expect.any(String),
        "a@example.com",
        "abc123",
        "hashed-password",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "a@example.com",
          username: "abc123",
          authToken: "signed-token",
        }),
      );
    });
  });

  describe("login", () => {
    it.each([
      {
        name: "required fields are missing",
        body: { email: "a@example.com" },
        after: () => expect(mockedFindUserByEmail).not.toHaveBeenCalled(),
        expectedStatus: 400,
        expectedCode: "VALIDATION_ERROR",
      },
      {
        name: "no user matches the email",
        body: { email: "nobody@example.com", password: "whatever1" },
        setup: () => {
          mockedFindUserByEmail.mockResolvedValue(undefined);
        },
        expectedStatus: 401,
        expectedCode: "INVALID_CREDENTIALS",
      },
      {
        name: "the password does not match",
        body: { email: "a@example.com", password: "wrongpass1" },
        setup: () => {
          mockedFindUserByEmail.mockResolvedValue({
            id: "user-1",
            username: "abc123",
            passwordHash: "hashed",
          });
          mockedBcryptCompare.mockResolvedValue(false as never);
        },
        expectedStatus: 401,
        expectedCode: "INVALID_CREDENTIALS",
      },
    ] satisfies ErrorCase[])(
      "returns $expectedStatus $expectedCode when $name",
      async ({ body, setup, after, expectedStatus, expectedCode }) => {
        setup?.();
        const req = createMockRequest(body);
        const res = createMockResponse();

        await login(req as Parameters<typeof login>[0], res);

        expect(res.status).toHaveBeenCalledWith(expectedStatus);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({ code: expectedCode }),
          }),
        );
        after?.();
      },
    );

    it("returns 200 with an access token on success", async () => {
      mockedFindUserByEmail.mockResolvedValue({
        id: "user-1",
        username: "abc123",
        passwordHash: "hashed",
      });
      mockedBcryptCompare.mockResolvedValue(true as never);

      const req = createMockRequest({
        email: "a@example.com",
        password: "correctpass1",
      });
      const res = createMockResponse();

      await login(req as Parameters<typeof login>[0], res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "successfully logged in",
          userId: "user-1",
        }),
      );
    });
  });
});

// Hits the real Express app and the real local Postgres database configured
// via .env.test -- no mocking. Each test creates its own uniquely-suffixed
// user and cleans it up afterward so runs stay repeatable.
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

  function uniqueUser() {
    const suffix = randomUUID().slice(0, 8);
    return {
      email: `int-test-${suffix}@sidequest.test`,
      username: `inttest_${suffix}`,
      password: "correct-horse-battery-1",
    };
  }

  it("registers a new user and persists it to postgres", async () => {
    const user = uniqueUser();
    createdEmails.push(user.email);

    const res = await request(app).post("/register").send(user);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: user.email,
      username: user.username,
    });
    expect(typeof res.body.authToken).toBe("string");

    const { rows } = await pool.query(
      "SELECT email, username FROM users WHERE email = $1",
      [user.email],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: user.email,
      username: user.username,
    });
  });

  it("logs in with correct credentials", async () => {
    const user = uniqueUser();
    createdEmails.push(user.email);

    const registerRes = await request(app)
      .post("/register")
      .send(user)
      .expect(201);

    const res = await request(app)
      .post("/login")
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "successfully logged in",
      userId: registerRes.body.id,
    });
  });

  it.each([
    {
      name: "register rejects a duplicate email",
      endpoint: "/register" as const,
      buildBody: async () => {
        const user = uniqueUser();
        createdEmails.push(user.email);
        await request(app).post("/register").send(user).expect(201);
        return { ...user, username: `${user.username}_other` };
      },
      expectedStatus: 409,
      expectedCode: "EMAIL_ALREADY_EXISTS",
    },
    {
      name: "register rejects missing fields",
      endpoint: "/register" as const,
      buildBody: async () => ({ email: "missing-fields@sidequest.test" }),
      expectedStatus: 400,
      expectedCode: "VALIDATION_ERROR",
    },
    {
      name: "login rejects an incorrect password",
      endpoint: "/login" as const,
      buildBody: async () => {
        const user = uniqueUser();
        createdEmails.push(user.email);
        await request(app).post("/register").send(user).expect(201);
        return { email: user.email, password: "wrong-password" };
      },
      expectedStatus: 401,
      expectedCode: "INVALID_CREDENTIALS",
    },
    {
      name: "login rejects an unknown email",
      endpoint: "/login" as const,
      buildBody: async () => ({
        email: "nobody-here@sidequest.test",
        password: "whatever1",
      }),
      expectedStatus: 401,
      expectedCode: "INVALID_CREDENTIALS",
    },
  ])(
    "$name -> $expectedStatus $expectedCode",
    async ({ endpoint, buildBody, expectedStatus, expectedCode }) => {
      const body = await buildBody();

      const res = await request(app).post(endpoint).send(body);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.error.code).toBe(expectedCode);
    },
  );
});
