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

describe("register", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = createMockRequest({ email: "a@example.com" });
    const res = createMockResponse();

    await register(req as Parameters<typeof register>[0], res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("returns 400 when the password is shorter than 8 characters", async () => {
    const req = createMockRequest({
      email: "a@example.com",
      username: "abc123",
      password: "short",
    });
    const res = createMockResponse();

    await register(req as Parameters<typeof register>[0], res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "WEAK_PASSWORD" }),
      }),
    );
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

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

  it("returns 400 USERNAME_TAKEN when the username is already in use", async () => {
    mockedBcryptHash.mockResolvedValue("hashed-password" as never);
    mockedCreateUser.mockRejectedValue(
      new DuplicateUsernameError("That username is already taken."),
    );

    const req = createMockRequest({
      email: "a@example.com",
      username: "abc123",
      password: "longenough1",
    });
    const res = createMockResponse();

    await register(req as Parameters<typeof register>[0], res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "USERNAME_TAKEN" }),
      }),
    );
  });

  it("returns 409 EMAIL_ALREADY_EXISTS when the email is already registered", async () => {
    mockedBcryptHash.mockResolvedValue("hashed-password" as never);
    mockedCreateUser.mockRejectedValue(
      new DuplicateUserError("An account with this email already exists."),
    );

    const req = createMockRequest({
      email: "a@example.com",
      username: "abc123",
      password: "longenough1",
    });
    const res = createMockResponse();

    await register(req as Parameters<typeof register>[0], res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "EMAIL_ALREADY_EXISTS" }),
      }),
    );
  });

  it("returns 500 INTERNAL_ERROR on unexpected db failures", async () => {
    mockedBcryptHash.mockResolvedValue("hashed-password" as never);
    mockedCreateUser.mockRejectedValue(new Error("connection lost"));

    const req = createMockRequest({
      email: "a@example.com",
      username: "abc123",
      password: "longenough1",
    });
    const res = createMockResponse();

    await register(req as Parameters<typeof register>[0], res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
      }),
    );
  });
});

describe("login", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = createMockRequest({ email: "a@example.com" });
    const res = createMockResponse();

    await login(req as Parameters<typeof login>[0], res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedFindUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 401 INVALID_CREDENTIALS when no user matches the email", async () => {
    mockedFindUserByEmail.mockResolvedValue(undefined);

    const req = createMockRequest({
      email: "nobody@example.com",
      password: "whatever1",
    });
    const res = createMockResponse();

    await login(req as Parameters<typeof login>[0], res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INVALID_CREDENTIALS" }),
      }),
    );
  });

  it("returns 401 INVALID_CREDENTIALS when the password does not match", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      username: "abc123",
      passwordHash: "hashed",
    });
    mockedBcryptCompare.mockResolvedValue(false as never);

    const req = createMockRequest({
      email: "a@example.com",
      password: "wrongpass1",
    });
    const res = createMockResponse();

    await login(req as Parameters<typeof login>[0], res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INVALID_CREDENTIALS" }),
      }),
    );
  });

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
