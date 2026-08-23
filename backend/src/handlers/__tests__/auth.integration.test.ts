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

  describe("POST /register", () => {
    it("creates a new user and persists it to postgres", async () => {
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

    it("rejects a duplicate email with 409", async () => {
      const user = uniqueUser();
      createdEmails.push(user.email);

      await request(app).post("/register").send(user).expect(201);

      const res = await request(app)
        .post("/register")
        .send({ ...user, username: `${user.username}_other` });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("rejects missing fields with 400", async () => {
      const res = await request(app)
        .post("/register")
        .send({ email: "missing-fields@sidequest.test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /login", () => {
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

    it("rejects an incorrect password with 401", async () => {
      const user = uniqueUser();
      createdEmails.push(user.email);

      await request(app).post("/register").send(user).expect(201);

      const res = await request(app)
        .post("/login")
        .send({ email: user.email, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejects an unknown email with 401", async () => {
      const res = await request(app).post("/login").send({
        email: "nobody-here@sidequest.test",
        password: "whatever1",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });
});
