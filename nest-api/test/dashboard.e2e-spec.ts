import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createE2eApp } from "./e2e-app";
import { createAuthenticatedSession } from "./auth-session.helper";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

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
 * Requires Redis to be running.
 */
describe("DashboardController (e2e)", () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    app = await createE2eApp();
    const session = await createAuthenticatedSession(app.getHttpServer() as SupertestApp);
    agent = session.agent;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/dashboard", () => {
    const farPastMonth = new Date(1970, 0, 1);
    const start = firstDayOfMonth(farPastMonth);

    it("should return 200 and null when no dashboard exists", () => {
      return agent
        .get("/api/dashboard")
        .query({ start })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeNull();
        });
    });

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .expect(401);
    });

    it("should return 401 with invalid session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/dashboard")
        .query({ start })
        .set("Cookie", "pfa.sid=invalid-session-id")
        .expect(401);
    });

    it("should return 400 when start is missing", () => {
      return agent
        .get("/api/dashboard")
        .expect(400);
    });
  });

  describe("POST /api/dashboard", () => {
    const now = new Date();
    const start = firstDayOfMonth(now);
    const end = lastDayOfMonth(now);

    it("should create dashboard and return insertId/ID", () => {
      return agent
        .post("/api/dashboard")
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

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/dashboard")
        .send({ start, end, amount: 100 })
        .expect(401);
    });

    it("should return 400 when amount is missing", () => {
      return agent
        .post("/api/dashboard")
        .send({ start, end })
        .expect(400);
    });

    it("should return 400 when start is missing", () => {
      return agent
        .post("/api/dashboard")
        .send({ end, amount: 100 })
        .expect(400);
    });
  });

  describe("GET /api/dashboard (with data)", () => {
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const start = firstDayOfMonth(nextMonth);
    const end = lastDayOfMonth(nextMonth);

    beforeAll(async () => {
      await agent
        .post("/api/dashboard")
        .send({ start, end, amount: 2000 })
        .expect(201);
    }, 15000);

    it("should return dashboard with initialAmount and initialCeiling", () => {
      return agent
        .get("/api/dashboard")
        .query({ start })
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

      const createRes = await agent
        .post("/api/dashboard")
        .send({ start, end, amount: 3000 })
        .expect(201);

      dashboardID = (createRes.body as CreateDashboardResponse).ID;
    }, 15000);

    it("should update amount", () => {
      return agent
        .put(`/api/dashboard/${dashboardID}`)
        .send({ amount: 3500 })
        .expect(200);
    });

    it("should update ceiling", () => {
      return agent
        .put(`/api/dashboard/${dashboardID}`)
        .send({ ceiling: 500 })
        .expect(200);
    });

    it("should update both amount and ceiling", () => {
      return agent
        .put(`/api/dashboard/${dashboardID}`)
        .send({ amount: 4000, ceiling: 600 })
        .expect(200);
    });

    it("should return 404 for non-existent dashboard", () => {
      return agent
        .put("/api/dashboard/00000000-0000-0000-0000-000000000000")
        .send({ amount: 100 })
        .expect(404);
    });

    it("should return 401 without session cookie", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/dashboard/${dashboardID}`)
        .send({ amount: 100 })
        .expect(401);
    });
  });
});
