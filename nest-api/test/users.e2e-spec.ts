import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createE2eApp } from "./e2e-app";
import { createAuthenticatedSession } from "./auth-session.helper";
import { PrismaService } from "../src/prisma/prisma.service";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  user: { id: string; name: string; email: string; baseCurrency: string };
  csrfToken: string;
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
          expect(body).toHaveProperty("csrfToken");
          expect(body).not.toHaveProperty("token");
          expect(body.user).toMatchObject({
            email: "e2e-test@test.com",
            name: expect.any(String),
            id: expect.any(String),
            baseCurrency: expect.any(String),
          });
          expect(typeof body.csrfToken).toBe("string");
          expect(body.csrfToken.length).toBeGreaterThan(0);

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
          expect(body).toHaveProperty("csrfToken");
          expect(body).not.toHaveProperty("token");
          expect(body.user).toMatchObject({
            email,
            name: "E2E Add User",
            id: expect.any(String),
            baseCurrency: "EUR",
          });
          expect(typeof body.csrfToken).toBe("string");
          expect(body.csrfToken.length).toBeGreaterThan(0);

          const setCookie = res.headers["set-cookie"];
          expect(setCookie).toBeDefined();
          expect(Array.isArray(setCookie) ? setCookie.join(" ") : setCookie).toMatch(/pfa\.sid=/);
        });
    });

    it("flags an account on the synthetic domain, and only that one (PFA-122)", async () => {
      process.env.SYNTHETIC_ALLOWED_IPS = "127.0.0.1,::1";
      const prisma = app.get(PrismaService);
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const emails = { synthetic: `e2e-bot-${stamp}@synthetic.test`, real: `e2e-real-${stamp}@test.com` };
      try {
        for (const email of Object.values(emails)) {
          await request(app.getHttpServer() as SupertestApp)
            .post("/api/users/add")
            .send({ name: "E2E Bot", email, password: "secure-password-123" })
            .expect(201);
        }
        const flags = await prisma.users.findMany({
          where: { email: { in: Object.values(emails) } },
          select: { email: true, isSynthetic: true },
        });
        expect(flags.find((u) => u.email === emails.synthetic)?.isSynthetic).toBe(true);
        expect(flags.find((u) => u.email === emails.real)?.isSynthetic).toBe(false);
      } finally {
        delete process.env.SYNTHETIC_ALLOWED_IPS;
        await prisma.users.deleteMany({ where: { email: { in: Object.values(emails) } } });
      }
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

  describe("GET /api/users/csrf", () => {
    it("should return 200 with csrf token when session exists", async () => {
      const { agent } = await createAuthenticatedSession(app.getHttpServer() as SupertestApp);
      return agent
        .get("/api/users/csrf")
        .expect(200)
        .expect((res) => {
          expect(typeof (res.body as { csrfToken: string }).csrfToken).toBe("string");
          expect((res.body as { csrfToken: string }).csrfToken.length).toBeGreaterThan(0);
        });
    });

    it("should return 401 without session", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/users/csrf")
        .expect(401);
    });
  });

  describe("POST /api/users/logout", () => {
    it("should return 200 and ok when session exists", async () => {
      const { agent } = await createAuthenticatedSession(app.getHttpServer() as SupertestApp);
      return agent.post("/api/users/logout").expect(200).expect({ ok: true });
    });

    it("should return 403 when session exists but csrf token is missing", async () => {
      const agent = request.agent(app.getHttpServer() as SupertestApp);
      await agent.post("/api/users").send({ email: "e2e-test@test.com", password: "e2e-test-password" }).expect(200);

      return agent.post("/api/users/logout").expect(403);
    });

    it("should return 200 even without session (no-op)", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users/logout")
        .expect(200)
        .expect({ ok: true });
    });
  });

  describe("synthetic accounts are locked to the bot runner's address (PFA-122)", () => {
    const server = () => app.getHttpServer() as SupertestApp;
    const email = `e2e-bot-${Date.now()}-${Math.random().toString(36).slice(2)}@synthetic.test`;
    const password = "secure-password-123";

    afterAll(async () => {
      delete process.env.SYNTHETIC_ALLOWED_IPS;
      await app.get(PrismaService).users.deleteMany({ where: { email } });
    });

    it("refuses a synthetic signup from an address off the allowlist", async () => {
      process.env.SYNTHETIC_ALLOWED_IPS = "203.0.113.7";
      await request(server()).post("/api/users/add").send({ name: "E2E Bot", email, password }).expect(403);
      expect(await app.get(PrismaService).users.count({ where: { email } })).toBe(0);
    });

    it("refuses everything when no allowlist is configured", async () => {
      delete process.env.SYNTHETIC_ALLOWED_IPS;
      await request(server()).post("/api/users/add").send({ name: "E2E Bot", email, password }).expect(403);
    });

    it("lets the bot in from the allowlist, then refuses its session and sign-in from elsewhere", async () => {
      process.env.SYNTHETIC_ALLOWED_IPS = "127.0.0.1,::1";
      const agent = request.agent(server());
      await agent.post("/api/users/add").send({ name: "E2E Bot", email, password }).expect(201);
      await agent.get("/api/users/me").expect(200);

      // Same cookie, seen from another address: refused, and the session is gone for good.
      process.env.SYNTHETIC_ALLOWED_IPS = "203.0.113.7";
      await agent.get("/api/users/me").expect(403);
      await request(server()).post("/api/users").send({ email, password }).expect(403);

      process.env.SYNTHETIC_ALLOWED_IPS = "127.0.0.1,::1";
      await agent.get("/api/users/me").expect(401);
    });

    it("lets only an allowlisted bot sign up while sign-ups are closed", async () => {
      process.env.SIGNUPS_ENABLED = "false";
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const bot = `e2e-closed-${stamp}@synthetic.test`;
      const human = `e2e-closed-${stamp}@test.com`;
      try {
        process.env.SYNTHETIC_ALLOWED_IPS = "127.0.0.1,::1";
        await request(server()).post("/api/users/add").send({ name: "E2E", email: human, password }).expect(403);
        await request(server()).post("/api/users/add").send({ name: "E2E", email: bot, password }).expect(201);
      } finally {
        delete process.env.SIGNUPS_ENABLED;
        await app.get(PrismaService).users.deleteMany({ where: { email: { in: [bot, human] } } });
      }
    });

    it("never affects a real account, allowlist or not", async () => {
      process.env.SYNTHETIC_ALLOWED_IPS = "203.0.113.7";
      await request(server())
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
        .expect(200);
    });
  });
});
