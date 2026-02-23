import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  user: { id: string; name: string; email: string; baseCurrency: string };
}

/**
 * E2E tests for user-related routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 * Requires Redis to be running.
 *
 * Routes covered:
 * - POST /api/users (sign-in)
 * - POST /api/users/add (create user)
 * - POST /api/users/logout
 * - POST /api/users/resetpassword - TODO
 */
describe("UsersController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/users (sign-in)", () => {
    it("should return user and Set-Cookie with httpOnly session on valid credentials", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
        .expect(200)
        .expect((res) => {
          const body = res.body as SignInResponseBody;
          expect(body).toHaveProperty("user");
          expect(body).not.toHaveProperty("token");
          expect(body.user).toMatchObject({
            email: "e2e-test@test.com",
            name: expect.any(String),
            id: expect.any(String),
            baseCurrency: expect.any(String),
          });

          const setCookie = res.headers["set-cookie"];
          expect(setCookie).toBeDefined();
          expect(Array.isArray(setCookie) ? setCookie.join(" ") : setCookie).toMatch(/pfa\.sid=/);
          expect(Array.isArray(setCookie) ? setCookie.join(" ") : setCookie).toMatch(/HttpOnly/i);
        });
    });

    it("should return 401 on invalid password", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "wrong-password" })
        .expect(401);
    });

    it("should return 401 on non-existent user", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "nonexistent@test.com", password: "any-password" })
        .expect(401);
    });

    it("should return 400 when email is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ password: "e2e-test-password" })
        .expect(400);
    });

    it("should return 400 when password is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com" })
        .expect(400);
    });
  });

  describe("POST /api/users/add", () => {
    const uniqueEmail = () => `e2e-add-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

    it("should create user and return 201 with user and Set-Cookie", () => {
      const email = uniqueEmail();
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/add")
        .send({
          name: "E2E Add User",
          email,
          password: "secure-password-123",
          baseCurrency: "EUR",
          language: "fr",
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as SignInResponseBody;
          expect(body).toHaveProperty("user");
          expect(body).not.toHaveProperty("token");
          expect(body.user).toMatchObject({
            email,
            name: "E2E Add User",
            id: expect.any(String),
            baseCurrency: "EUR",
          });

          const setCookie = res.headers["set-cookie"];
          expect(setCookie).toBeDefined();
          expect(Array.isArray(setCookie) ? setCookie.join(" ") : setCookie).toMatch(/pfa\.sid=/);
        });
    });

    it("should return 409 when email already exists", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/add")
        .send({
          name: "Duplicate",
          email: "e2e-test@test.com",
          password: "any-password",
        })
        .expect(409);
    });

    it("should return 400 when name is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/add")
        .send({ email: uniqueEmail(), password: "password" })
        .expect(400);
    });

    it("should return 400 when email is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/add")
        .send({ name: "Test", password: "password" })
        .expect(400);
    });

    it("should return 400 when password is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/add")
        .send({ name: "Test", email: uniqueEmail() })
        .expect(400);
    });
  });

  describe("POST /api/users/logout", () => {
    it("should return 200 and ok when session exists", async () => {
      const agent = request.agent(app.getHttpServer() as SupertestApp);
      await agent
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
        .expect(200);

      return agent.post("/api/users/logout").expect(200).expect({ ok: true });
    });

    it("should return 200 even without session (no-op)", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/logout")
        .expect(200)
        .expect({ ok: true });
    });
  });
});
