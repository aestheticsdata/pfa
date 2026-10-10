import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];

const TOKEN = "e2e-synthetic-admin-token-0123456789abcdef";
const BOT = `e2e-disable-${Date.now()}@synthetic.test`;
const PASSWORD = "e2e-bot-password-long";

/**
 * The bot back-office's disable / purge (PFA-127), through the internal route the runner calls.
 * Requires Redis and the local DB; `SYNTHETIC_ALLOWED_IPS` must include loopback for the bot signup.
 */
describe("SyntheticAccountsController (e2e)", () => {
  let app: INestApplication;
  let server: SupertestApp;
  const previous = { token: process.env.SYNTHETIC_ADMIN_TOKEN, ips: process.env.SYNTHETIC_ALLOWED_IPS };

  beforeAll(async () => {
    process.env.SYNTHETIC_ADMIN_TOKEN = TOKEN;
    process.env.SYNTHETIC_ALLOWED_IPS = "127.0.0.1,::1,::ffff:127.0.0.1";
    app = await createE2eApp();
    server = app.getHttpServer() as SupertestApp;
    await request(server).post("/api/users/add").send({ name: "e2e-bot", email: BOT, password: PASSWORD }).expect(201);
  }, 15000);

  afterAll(async () => {
    await request(server)
      .delete(`/api/internal/synthetic/accounts/${encodeURIComponent(BOT)}`)
      .set("authorization", `Bearer ${TOKEN}`);
    await app.close();
    process.env.SYNTHETIC_ADMIN_TOKEN = previous.token;
    process.env.SYNTHETIC_ALLOWED_IPS = previous.ips;
  });

  const disable = (email: string) =>
    request(server).post(`/api/internal/synthetic/accounts/${encodeURIComponent(email)}/disable`);

  it("answers 404 without the token, or through a proxy", async () => {
    await disable(BOT).expect(404);
    await disable(BOT).set("authorization", `Bearer ${TOKEN}`).set("x-forwarded-for", "203.0.113.9").expect(404);
  });

  it("never touches a non-synthetic account", async () => {
    await disable("e2e-test@test.com").set("authorization", `Bearer ${TOKEN}`).expect(404);
  });

  it("disables a bot: its session is revoked and sign-in is refused", async () => {
    const agent = request.agent(server);
    await agent.post("/api/users").send({ email: BOT, password: PASSWORD }).expect(200);
    await agent.get("/api/users/me").expect(200);

    await disable(BOT).set("authorization", `Bearer ${TOKEN}`).expect(200);

    await agent.get("/api/users/me").expect(401);
    await request(server).post("/api/users").send({ email: BOT, password: PASSWORD }).expect(403);
  });

  it("purges a bot, after which it is unknown", async () => {
    await request(server)
      .delete(`/api/internal/synthetic/accounts/${encodeURIComponent(BOT)}`)
      .set("authorization", `Bearer ${TOKEN}`)
      .expect(200);
    await request(server).post("/api/users").send({ email: BOT, password: PASSWORD }).expect(401);
  });
});
