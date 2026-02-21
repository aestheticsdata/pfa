import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string };
}

interface DashboardItem {
  ID: string;
  dateFrom: string;
  dateTo: string;
  initialAmount: number;
  initialCeiling: number | null;
  userID: string;
}

interface CreateDashboardResponse {
  insertId: string;
  ID: string;
}

function firstDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

function lastDayOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
}

/**
 * E2E tests for dashboard routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 */
describe("DashboardController (e2e)", () => {
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

  describe("GET /api/dashboard", () => {
    const farPastMonth = new Date(1970, 0, 1);
    const start = firstDayOfMonth(farPastMonth);

    it("should return 200 and null when no dashboard exists", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeNull();
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should return 400 when start is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("POST /api/dashboard", () => {
    const now = new Date();
    const start = firstDayOfMonth(now);
    const end = lastDayOfMonth(now);

    it("should create dashboard and return insertId/ID", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          start,
          end,
          amount: 1500,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CreateDashboardResponse;
          expect(body).toHaveProperty("insertId");
          expect(body).toHaveProperty("ID");
          expect(typeof body.ID).toBe("string");
          expect(body.ID.length).toBeGreaterThan(0);
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .send({ start, end, amount: 100 })
        .expect(401);
    });

    it("should return 400 when amount is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ start, end })
        .expect(400);
    });

    it("should return 400 when start is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ end, amount: 100 })
        .expect(400);
    });
  });

  describe("GET /api/dashboard (with data)", () => {
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const start = firstDayOfMonth(nextMonth);
    const end = lastDayOfMonth(nextMonth);

    beforeAll(async () => {
      await request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ start, end, amount: 2000 })
        .expect(201);
    }, 15000);

    it("should return dashboard with initialAmount and initialCeiling", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toBeNull();
          const d = res.body as DashboardItem;
          expect(d).toHaveProperty("ID");
          expect(d).toHaveProperty("dateFrom");
          expect(d).toHaveProperty("dateTo");
          expect(d).toHaveProperty("initialAmount");
          expect(d).toHaveProperty("initialCeiling");
          expect(d).toHaveProperty("userID");
          expect(typeof d.initialAmount).toBe("number");
          expect(d.initialAmount).toBe(2000);
        });
    });
  });

  describe("PUT /api/dashboard/:id", () => {
    let dashboardID: string;

    beforeAll(async () => {
      const now = new Date();
      const start = firstDayOfMonth(now);
      const end = lastDayOfMonth(now);

      const createRes = await request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ start, end, amount: 3000 })
        .expect(201);

      dashboardID = (createRes.body as CreateDashboardResponse).ID;
    }, 15000);

    it("should update amount", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/dashboard/${dashboardID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ amount: 3500 })
        .expect(200);
    });

    it("should update ceiling", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/dashboard/${dashboardID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ceiling: 500 })
        .expect(200);
    });

    it("should update both amount and ceiling", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/dashboard/${dashboardID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ amount: 4000, ceiling: 600 })
        .expect(200);
    });

    it("should return 404 for non-existent dashboard", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put("/api/dashboard/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ amount: 100 })
        .expect(404);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/dashboard/${dashboardID}`)
        .send({ amount: 100 })
        .expect(401);
    });
  });
});
