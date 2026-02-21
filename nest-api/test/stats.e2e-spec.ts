import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string };
}

function firstDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

/**
 * E2E tests for weeklystats and monthlystats routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 */
describe("StatsController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix("api");
    await app.init();

    const signInRes = await request(app.getHttpServer() as SupertestApp)
      .post("/api/users")
      .send({ email: "e2e-test@test.com", password: "e2e-test-password" });
    authToken = (signInRes.body as SignInResponseBody).token;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/weeklystats", () => {
    const now = new Date();
    const start = firstDayOfMonth(now);

    it("should return 200 and array of weekly totals", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/weeklystats")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((val: unknown) => {
            expect(typeof val).toBe("number");
          });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/weeklystats")
        .query({ start })
        .expect(401);
    });

    it("should return 400 when start is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/weeklystats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("GET /api/monthlystats", () => {
    const now = new Date();
    const from = firstDayOfMonth(now);

    it("should return 200 and spendingsSum/recurringsSum", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/monthlystats")
        .query({ from })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("spendingsSum");
          expect(res.body).toHaveProperty("recurringsSum");
          expect(res.body.spendingsSum).toHaveProperty("amount");
          expect(res.body.recurringsSum).toHaveProperty("amount");
          expect(typeof res.body.spendingsSum.amount).toBe("string");
          expect(typeof res.body.recurringsSum.amount).toBe("string");
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/monthlystats")
        .query({ from })
        .expect(401);
    });

    it("should return 400 when from is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/monthlystats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
