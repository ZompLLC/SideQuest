import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register, login } from "../auth.handler.js";
import {
  createUser,
  findUserByEmail,
  DuplicateUsernameError,
  DuplicateUserError,
} from "../../../db.js";
import { createMockRequest, createMockResponse } from "./testHelpers.js";

jest.mock("../../../db.js", () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  DuplicateUsernameError: class DuplicateUsernameError extends Error {},
  DuplicateUserError: class DuplicateUserError extends Error {},
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

const mockedCreateUser = jest.mocked(createUser);
const mockedFindUserByEmail = jest.mocked(findUserByEmail);
const mockedBcryptHash = jest.mocked(bcrypt.hash);
const mockedBcryptCompare = jest.mocked(bcrypt.compare);
const mockedJwtSign = jest.mocked(jwt.sign);

beforeEach(() => {
  jest.clearAllMocks();
});

type ErrorCase = {
  name: string;
  body: Record<string, unknown>;
  setup?: () => void;
  after?: () => void;
  expectedStatus: number;
  expectedCode: string;
};

const registerErrorCases: ErrorCase[] = [
  {
    name: "required fields are missing",
    body: { email: "a@example.com" },
    after: () => expect(mockedCreateUser).not.toHaveBeenCalled(),
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
  },
  {
    name: "the password is shorter than 8 characters",
    body: { email: "a@example.com", username: "abc123", password: "short" },
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
        new DuplicateUserError("An account with this email already exists."),
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
];

describe("register", () => {
  it.each(registerErrorCases)(
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

const loginErrorCases: ErrorCase[] = [
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
];

describe("login", () => {
  it.each(loginErrorCases)(
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
