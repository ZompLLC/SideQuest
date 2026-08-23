import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../app.js";
import { pool } from "../../../db.js";

// Hits the real Express app and the real local Postgres database configured
// via .env.test -- no mocking. Each test creates its own uniquely-suffixed
// user and cleans it up afterward so runs stay repeatable.
describe("auth integration (real Postgres)", () => {
  const createdEmails: string[] = [];

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

  type ApiErrorCase = {
    name: string;
    endpoint: "/register" | "/login";
    buildBody: () => Promise<Record<string, unknown>>;
    expectedStatus: number;
    expectedCode: string;
  };

  const apiErrorCases: ApiErrorCase[] = [
    {
      name: "register rejects a duplicate email",
      endpoint: "/register",
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
      endpoint: "/register",
      buildBody: async () => ({ email: "missing-fields@sidequest.test" }),
      expectedStatus: 400,
      expectedCode: "VALIDATION_ERROR",
    },
    {
      name: "login rejects an incorrect password",
      endpoint: "/login",
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
      endpoint: "/login",
      buildBody: async () => ({
        email: "nobody-here@sidequest.test",
        password: "whatever1",
      }),
      expectedStatus: 401,
      expectedCode: "INVALID_CREDENTIALS",
    },
  ];

  it.each(apiErrorCases)(
    "$name -> $expectedStatus $expectedCode",
    async ({ endpoint, buildBody, expectedStatus, expectedCode }) => {
      const body = await buildBody();

      const res = await request(app).post(endpoint).send(body);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.error.code).toBe(expectedCode);
    },
  );
});
