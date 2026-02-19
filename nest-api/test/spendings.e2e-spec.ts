import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { join } from "path";
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
  categoryID: string | null;
  category: string | null;
  categoryColor: string | null;
}

const FIXTURE_IMAGE = join(__dirname, "fixtures", "galaxy.jpg");

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function randomCategoryName(): string {
  const len = 4 + Math.floor(Math.random() * 7);
  return Array.from({ length: len }, () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]).join("");
}

/**
 * E2E tests for spendings routes.
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

  describe("POST /api/spendings/upload", () => {
    let uploadSpendingID: string;

    beforeAll(async () => {
      await request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: todayISO(),
          label: "e2e-upload-test",
          amount: 5,
          currency: "EUR",
        })
        .expect(201);

      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2020-01-01", to: "2030-12-31" })
        .set("Authorization", `Bearer ${authToken}`);
      const spendings = listRes.body as SpendingItem[];
      const found = spendings.find((s) => s.label === "e2e-upload-test");
      uploadSpendingID = found!.ID;
    }, 15000);

    it("should upload, resize and return image as base64", async () => {
      const res = await request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("spendingID", uploadSpendingID)
        .field("itemType", "spending")
        .field("date", todayISO())
        .field("label", "e2e-upload-test")
        .attach("invoiceImageUpload", FIXTURE_IMAGE);

      expect(res.status).toBe(200);
      const body = res.text ?? (Buffer.isBuffer(res.body) ? res.body.toString() : String(res.body));
      expect(body).toMatch(/^data:image\/\w+;base64,/);
    });

    it("should be retrievable via GET /upload/:id after upload", async () => {
      const res = await request(app.getHttpServer() as SupertestApp)
        .get(`/api/spendings/upload/${uploadSpendingID}`)
        .query({ itemType: "spending" })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const body = res.text ?? (Buffer.isBuffer(res.body) ? res.body.toString() : String(res.body));
      expect(body).toMatch(/^data:image\/\w+;base64,/);
    });

    it("should return 400 when no file is attached", async () => {
      const res = await request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("spendingID", uploadSpendingID)
        .field("itemType", "spending")
        .field("date", todayISO())
        .field("label", "e2e-upload-test");

      expect(res.status).toBe(400);
    });

    it("should return 400 when spendingID is missing", async () => {
      const res = await request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("itemType", "spending")
        .field("date", todayISO())
        .field("label", "e2e-upload-test")
        .attach("invoiceImageUpload", FIXTURE_IMAGE);

      expect(res.status).toBe(400);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings/upload")
        .field("spendingID", "fake-id")
        .field("itemType", "spending")
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings/upload")
        .set("Authorization", "Bearer invalid-token")
        .field("spendingID", "fake-id")
        .field("itemType", "spending")
        .expect(401);
    });
  });

  describe("GET /api/spendings/upload/:id", () => {
    it("should return 200 with null when spending has no invoice", async () => {
      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2020-01-01", to: "2030-12-31" })
        .set("Authorization", `Bearer ${authToken}`);
      const spendings = listRes.body as SpendingItem[];
      const withoutInvoice = spendings.find((s) => s.label === "e2e-spending-no-category");
      const spendingID = withoutInvoice?.ID ?? "00000000-0000-0000-0000-000000000000";

      const res = await request(app.getHttpServer() as SupertestApp)
        .get(`/api/spendings/upload/${spendingID}`)
        .query({ itemType: "spending" })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings/upload/00000000-0000-0000-0000-000000000000")
        .query({ itemType: "spending" })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings/upload/00000000-0000-0000-0000-000000000000")
        .query({ itemType: "spending" })
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should return 400 when itemType is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings/upload/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("POST /api/spendings", () => {
    let existingCategoryID: string | null = null;

    const assertSuccess = (res: { body: unknown; text: string }) => {
      const body = typeof res.body === "string" ? res.body : res.text;
      expect(body).toBe("new spending added");
    };

    beforeAll(async () => {
      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2020-01-01", to: "2030-12-31" })
        .set("Authorization", `Bearer ${authToken}`);
      const spendings = listRes.body as SpendingItem[];
      const withCategory = spendings.find((s) => s.categoryID != null);
      if (withCategory) existingCategoryID = withCategory.categoryID;
    });

    it("should create spending without category", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: todayISO(),
          label: "e2e-spending-no-category",
          amount: 10,
          currency: "EUR",
        })
        .expect(201)
        .expect(assertSuccess);
    });

    it("should create spending with new category", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: todayISO(),
          label: "e2e-spending-new-cat",
          amount: 20,
          category: { ID: null, name: randomCategoryName(), color: "#ff0000" },
          currency: "EUR",
        })
        .expect(201)
        .expect(assertSuccess);
    });

    it("should create spending with existing category", () => {
      expect(existingCategoryID).not.toBeNull();
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: todayISO(),
          label: "e2e-spending-existing-cat",
          amount: 30,
          category: { ID: existingCategoryID },
          currency: "EUR",
        })
        .expect(201)
        .expect(assertSuccess);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .send({
          date: todayISO(),
          label: "test",
          amount: 10,
          currency: "EUR",
        })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", "Bearer invalid-token")
        .send({
          date: todayISO(),
          label: "test",
          amount: 10,
          currency: "EUR",
        })
        .expect(401);
    });

    it("should return 400 when date is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ label: "test", amount: 10, currency: "EUR" })
        .expect(400);
    });

    it("should return 400 when label is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ date: todayISO(), amount: 10, currency: "EUR" })
        .expect(400);
    });

    it("should return 400 when amount is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ date: todayISO(), label: "test", currency: "EUR" })
        .expect(400);
    });

    it("should return 400 when currency is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ date: todayISO(), label: "test", amount: 10 })
        .expect(400);
    });
  });

  describe("PUT /api/spendings/:id", () => {
    let updateSpendingID: string;

    beforeAll(async () => {
      await request(app.getHttpServer() as SupertestApp)
        .post("/api/spendings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: todayISO(),
          label: "e2e-update-test",
          amount: 50,
          currency: "EUR",
        })
        .expect(201);

      const listRes = await request(app.getHttpServer() as SupertestApp)
        .get("/api/spendings")
        .query({ from: "2020-01-01", to: "2030-12-31" })
        .set("Authorization", `Bearer ${authToken}`);
      const found = (listRes.body as SpendingItem[]).find((s) => s.label === "e2e-update-test");
      updateSpendingID = found!.ID;
    }, 15000);

    it("should update label and amount", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/spendings/${updateSpendingID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ label: "e2e-update-test-updated", amount: 99 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ success: true });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/spendings/${updateSpendingID}`)
        .send({ label: "test", amount: 10 })
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/spendings/${updateSpendingID}`)
        .set("Authorization", "Bearer invalid-token")
        .send({ label: "test", amount: 10 })
        .expect(401);
    });

    it("should return 404 for non-existent spending", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put("/api/spendings/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ label: "test", amount: 10 })
        .expect(404);
    });
  });
});
