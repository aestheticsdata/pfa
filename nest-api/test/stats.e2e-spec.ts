import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { randomUUID } from "crypto";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string };
}

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
 */
describe("StatsController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let categoryID: string;

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
    userId = (signInRes.body as SignInResponseBody).user.id;

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
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/weeklystats")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          (res.body as number[]).forEach((val) => {
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

  describe("GET /api/statistics", () => {
    const years = generateYearRange(new Date().getFullYear() - 1);

    it("should return 200 and colors/data structure", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/statistics")
        .query({ categories: categoryID, years })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as { colors: Record<string, string>; data: Record<string, unknown> };
          expect(body).toHaveProperty("colors");
          expect(body).toHaveProperty("data");
          expect(typeof body.colors).toBe("object");
          expect(typeof body.data).toBe("object");
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/statistics")
        .query({ categories: categoryID, years })
        .expect(401);
    });

    it("should return 400 when categories is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/statistics")
        .query({ years })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });

    it("should return 400 when years is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/statistics")
        .query({ categories: categoryID })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
