import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string };
}

interface RecurringItem {
  ID: string;
  userID: string;
  dateFrom: string;
  dateTo: string;
  label: string;
  amount: string;
  currency: string | null;
  itemType: string;
}

function firstDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

function lastDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
}

/**
 * E2E tests for recurrings routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 */
describe("RecurringsController (e2e)", () => {
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

  describe("GET /api/recurrings", () => {
    it("should return 200 and array of recurrings with valid token", () => {
      const start = firstDayOfMonth(new Date());
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          (res.body as RecurringItem[]).forEach((item) => {
            expect(item).toHaveProperty("ID");
            expect(item).toHaveProperty("dateFrom");
            expect(item).toHaveProperty("dateTo");
            expect(item).toHaveProperty("label");
            expect(item).toHaveProperty("amount");
          });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .query({ start: firstDayOfMonth(new Date()) })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .query({ start: firstDayOfMonth(new Date()) })
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should return 400 when start is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("POST /api/recurrings", () => {
    const now = new Date();
    const start = firstDayOfMonth(now);
    const end = lastDayOfMonth(now);

    it("should create recurring and return success", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          start,
          end,
          label: "e2e-recurring-test",
          amount: 100,
          currency: "EUR",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ message: "new recurring added" });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .send({ start, end, label: "test", amount: 10, currency: "EUR" })
        .expect(401);
    });

    it("should return 400 when label is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ start, end, amount: 10, currency: "EUR" })
        .expect(400);
    });

    it("should return 400 when amount is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ start, end, label: "test", currency: "EUR" })
        .expect(400);
    });
  });

  describe("PUT /api/recurrings/:id", () => {
    let updateRecurringID: string;

    beforeAll(async () => {
      const now = new Date();
      const start = firstDayOfMonth(now);
      const end = lastDayOfMonth(now);

      await request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          start,
          end,
          label: "e2e-update-recurring",
          amount: 50,
          currency: "EUR",
        })
        .expect(201);

      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`);
      const found = (listRes.body as RecurringItem[]).find((r) => r.label === "e2e-update-recurring");
      updateRecurringID = found!.ID;
    }, 15000);

    it("should update label and amount", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/recurrings/${updateRecurringID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ label: "e2e-update-recurring-updated", amount: 99 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ success: true });
        });
    });

    it("should return 404 for non-existent recurring", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put("/api/recurrings/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ label: "test", amount: 10 })
        .expect(404);
    });
  });

  describe("POST /api/recurrings/copy", () => {
    it("should copy recurrings and return success", () => {
      const now = new Date();
      const currentStart = firstDayOfMonth(now);
      const currentEnd = lastDayOfMonth(now);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthStart = firstDayOfMonth(prevMonth);

      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings/copy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          dates: {
            start: currentStart,
            end: currentEnd,
            previousMonthStart,
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ msg: "recurrings copied" });
        });
    });

    it("should return 401 without Authorization header", () => {
      const now = new Date();
      const currentStart = firstDayOfMonth(now);
      const currentEnd = lastDayOfMonth(now);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthStart = firstDayOfMonth(prevMonth);

      return request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings/copy")
        .send({
          dates: { start: currentStart, end: currentEnd, previousMonthStart },
        })
        .expect(401);
    });
  });

  describe("DELETE /api/recurrings/:id", () => {
    let deleteRecurringID: string;

    beforeAll(async () => {
      const now = new Date();
      const start = firstDayOfMonth(now);
      const end = lastDayOfMonth(now);

      await request(app.getHttpServer() as SupertestApp)
        .post("/api/recurrings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          start,
          end,
          label: "e2e-delete-recurring",
          amount: 77,
          currency: "EUR",
        })
        .expect(201);

      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/recurrings")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`);
      const found = (listRes.body as RecurringItem[]).find((r) => r.label === "e2e-delete-recurring");
      deleteRecurringID = found!.ID;
    }, 15000);

    it("should delete recurring and return success", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete(`/api/recurrings/${deleteRecurringID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ success: true });
        });
    });

    it("should return 404 when deleting already deleted recurring", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete(`/api/recurrings/${deleteRecurringID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent recurring", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete("/api/recurrings/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
