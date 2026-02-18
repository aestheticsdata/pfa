import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string };
}

interface SpendingItem {
  ID: string;
  userID: string;
  date: string;
  itemType: string;
  label: string;
  amount: string;
  category: string | null;
  categoryColor: string | null;
}

/**
 * E2E tests for GET /api/spendings.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 */
describe("SpendingsController (e2e)", () => {
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

  describe("GET /api/spendings", () => {
    it("should return 200 and array of spendings with valid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2024-01-01", to: "2024-12-31" })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          (res.body as SpendingItem[]).forEach((item) => {
            console.log(item);
            expect(item).toHaveProperty("ID");
            expect(item).toHaveProperty("date");
            expect(item).toHaveProperty("amount");
            expect(item).toHaveProperty("category");
            expect(item).toHaveProperty("categoryColor");
          });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2024-01-01", to: "2024-12-31" })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2024-01-01", to: "2024-12-31" })
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should return 400 when from is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ to: "2024-12-31" })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });

    it("should return 400 when to is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2024-01-01" })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
