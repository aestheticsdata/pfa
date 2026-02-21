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

interface CategoryItem {
  ID: string;
  userID: string | null;
  name: string;
  color: string;
}

/**
 * E2E tests for categories routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 */
describe("CategoriesController (e2e)", () => {
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
        name: "e2e-test-category",
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

  describe("GET /api/categories", () => {
    it("should return 200 and array of categories", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          (res.body as CategoryItem[]).forEach((item) => {
            expect(item).toHaveProperty("ID");
            expect(item).toHaveProperty("name");
            expect(item).toHaveProperty("color");
          });
        });
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/categories")
        .expect(401);
    });

    it("should return 401 with invalid token", () => {
      return request(app.getHttpServer() as SupertestApp)
        .get("/api/categories")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should update category and return all categories", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/categories/${categoryID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "e2e-updated-category", color: "#00ff00" })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const updated = (res.body as CategoryItem[]).find((c) => c.ID === categoryID);
          expect(updated).toBeDefined();
          expect(updated!.name).toBe("e2e-updated-category");
          expect(updated!.color).toBe("#00ff00");
        });
    });

    it("should return 404 for non-existent category", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put("/api/categories/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "test", color: "#000" })
        .expect(404);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/categories/${categoryID}`)
        .send({ name: "test", color: "#000" })
        .expect(401);
    });

    it("should return 400 when name is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .put(`/api/categories/${categoryID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ color: "#000" })
        .expect(400);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    let deleteCategoryID: string;

    beforeAll(async () => {
      const prisma = app.get(PrismaService);
      const cat = await prisma.categories.create({
        data: {
          ID: randomUUID(),
          userID: userId,
          name: "e2e-delete-category",
          color: "#0000ff",
        },
      });
      deleteCategoryID = cat.ID;
    }, 5000);

    it("should delete category and return success", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete(`/api/categories/${deleteCategoryID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ success: true });
        });
    });

    it("should return 404 when deleting already deleted category", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete(`/api/categories/${deleteCategoryID}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent category", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete("/api/categories/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 401 without Authorization header", () => {
      return request(app.getHttpServer() as SupertestApp)
        .delete(`/api/categories/${categoryID}`)
        .expect(401);
    });
  });
});
