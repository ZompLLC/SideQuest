import { login, signup } from "../api/auth";

describe("login", () => {
  type LoginCase = {
    name: string;
    email: string;
    password: string;
    shouldResolve: boolean;
  };

  const cases: LoginCase[] = [
    {
      name: "valid credentials",
      email: "a@example.com",
      password: "longenough1",
      shouldResolve: true,
    },
    {
      name: "missing email",
      email: "",
      password: "longenough1",
      shouldResolve: false,
    },
    {
      name: "missing password",
      email: "a@example.com",
      password: "",
      shouldResolve: false,
    },
  ];

  it.each(cases)(
    "$name -> resolves: $shouldResolve",
    async ({ email, password, shouldResolve }) => {
      if (shouldResolve) {
        await expect(login(email, password)).resolves.toMatchObject({
          id: "u3",
          username: "You",
          email: "you@example.com",
        });
      } else {
        await expect(login(email, password)).rejects.toThrow(
          "Invalid credentials",
        );
      }
    },
  );
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
