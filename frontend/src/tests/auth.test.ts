import { login, signup } from "../api/auth";

describe("login", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("posts to /login, fetches the user profile, and returns it with the auth token", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "successfully logged in",
          accessToken: "signed-token",
          userId: "user-1",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "user-1",
          username: "abc123",
          email: "a@example.com",
          createdAt: "2026-01-01T00:00:00.000Z",
        }),
      }) as unknown as typeof fetch;

    const result = await login("a@example.com", "longenough1");

    expect(result).toEqual({
      user: { id: "user-1", username: "abc123", email: "a@example.com" },
      authToken: "signed-token",
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/login"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "a@example.com",
          password: "longenough1",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/users/user-1"),
    );
  });

  it("throws with the server's error message on invalid credentials", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        },
      }),
    }) as unknown as typeof fetch;

    await expect(login("a@example.com", "wrongpassword")).rejects.toThrow(
      "Email or password is incorrect.",
    );
  });

  it("throws with the server's error message on missing fields", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      }),
    }) as unknown as typeof fetch;

    await expect(login("", "longenough1")).rejects.toThrow(
      "Email and password are required.",
    );
  });
});

describe("signup", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("posts to /register and returns the created user and auth token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        id: "user-1",
        username: "abc123",
        email: "a@example.com",
        authToken: "signed-token",
      }),
    }) as unknown as typeof fetch;

    const result = await signup("abc123", "a@example.com", "longenough1");

    expect(result).toEqual({
      user: { id: "user-1", username: "abc123", email: "a@example.com" },
      authToken: "signed-token",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "abc123",
          email: "a@example.com",
          password: "longenough1",
        }),
      }),
    );
  });

  type SignupErrorCase = {
    name: string;
    errorMessage: string;
  };

  const errorCases: SignupErrorCase[] = [
    {
      name: "duplicate email",
      errorMessage: "An account with this email already exists.",
    },
    {
      name: "duplicate username",
      errorMessage: "That username is already taken.",
    },
    {
      name: "validation error",
      errorMessage: "Email, Username, and Password are required.",
    },
  ];

  it.each(errorCases)(
    "throws with the server's error message on $name",
    async ({ errorMessage }) => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          error: { code: "SOME_CODE", message: errorMessage },
        }),
      }) as unknown as typeof fetch;

      await expect(
        signup("abc123", "a@example.com", "longenough1"),
      ).rejects.toThrow(errorMessage);
    },
  );
});
