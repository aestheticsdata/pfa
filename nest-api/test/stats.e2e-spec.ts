import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { randomUUID } from "crypto";
import { PrismaService } from "../src/prisma/prisma.service";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

function firstDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

function generateYearRange(startYear: number): string {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  return years.join(",");
}

/**
 * E2E tests for weeklystats, monthlystats and statistics routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 * Requires Redis to be running.
 */
describe("StatsController (e2e)", () => {
  let app: INestApplication;
  let agent: Agent;
  let userId: string;
  let categoryID: string;

  beforeAll(async () => {
    app = await createE2eApp();
    agent = request.agent(app.getHttpServer() as SupertestApp);
    const signInRes = await agent
      .post("/api/users")
      .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
      .expect(200);
    userId = (signInRes.body as { user: { id: string } }).user.id;

    const prisma = app.get(PrismaService);
    const category = await prisma.categories.create({
      data: {
        ID: randomUUID(),
        userID: userId,
        name: "e2e-statistics-cat",
        color: "#ff0000",
      },
    });
    categoryID = category.ID;
  }, 15000);

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    await prisma.categories.deleteMany({ where: { userID: userId } });
    await app.close();
  });

  describe("GET /api/weeklystats", () => {
    const now = new Date();
    const start = firstDayOfMonth(now);

    it("should return 200 and array of weekly totals", () => {
      return agent
        .get("/api/weeklystats")
        .query({ start })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          (res.body as number[]).forEach((val) => {
            expect(typeof val).toBe("number");
          });
        });
    });

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/weeklystats")
        .query({ start })
        .expect(401);
    });

    it("should return 400 when start is missing", () => {
      return agent
        .get("/api/weeklystats")
        .expect(400);
    });
  });

  describe("GET /api/monthlystats", () => {
    const now = new Date();
    const from = firstDayOfMonth(now);

    it("should return 200 and spendingsSum/recurringsSum", () => {
      return agent
        .get("/api/monthlystats")
        .query({ from })
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            spendingsSum: { amount: string };
            recurringsSum: { amount: string };
          };
          expect(body).toHaveProperty("spendingsSum");
          expect(body).toHaveProperty("recurringsSum");
          expect(body.spendingsSum).toHaveProperty("amount");
          expect(body.recurringsSum).toHaveProperty("amount");
          expect(typeof body.spendingsSum.amount).toBe("string");
          expect(typeof body.recurringsSum.amount).toBe("string");
        });
    });

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/monthlystats")
        .query({ from })
        .expect(401);
    });

    it("should return 400 when from is missing", () => {
      return agent
        .get("/api/monthlystats")
        .expect(400);
    });
  });

  describe("GET /api/statistics", () => {
    const years = generateYearRange(new Date().getFullYear() - 1);

    it("should return 200 and colors/data structure", () => {
      return agent
        .get("/api/statistics")
        .query({ categories: categoryID, years })
        .expect(200)
        .expect((res) => {
          const body = res.body as { colors: Record<string, string>; data: Record<string, unknown> };
          expect(body).toHaveProperty("colors");
          expect(body).toHaveProperty("data");
          expect(typeof body.colors).toBe("object");
          expect(typeof body.data).toBe("object");
        });
    });

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/statistics")
        .query({ categories: categoryID, years })
        .expect(401);
    });

    it("should return 400 when categories is missing", () => {
      return agent
        .get("/api/statistics")
        .query({ years })
        .expect(400);
    });

    it("should return 400 when years is missing", () => {
      return agent
        .get("/api/statistics")
        .query({ categories: categoryID })
        .expect(400);
    });
  });
});
