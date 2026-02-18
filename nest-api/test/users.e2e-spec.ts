import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

type SupertestApp = Parameters<typeof request>[0];

interface SignInResponseBody {
  token: string;
  user: { id: string; name: string; email: string; baseCurrency: string };
}

/**
 * E2E tests for user-related routes.
 * Test user: e2e-test@test.com / e2e-test-password (must exist in local DB)
 *
 * Routes covered (as they are migrated to Nest):
 * - POST /api/users (sign-in)
 * - POST /api/users/add (create user) - TODO
 * - POST /api/users/resetpassword - TODO
 */
describe("UsersController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/users (sign-in)", () => {
    it("should return token and user on valid credentials", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "e2e-test-password" })
        .expect(200)
        .expect((res) => {
          const body = res.body as SignInResponseBody;
          expect(body).toHaveProperty("token");
          expect(typeof body.token).toBe("string");
          expect(body).toHaveProperty("user");
          expect(body.user).toMatchObject({
            email: "e2e-test@test.com",
            name: expect.any(String),
            id: expect.any(String),
            baseCurrency: expect.any(String),
          });
        });
    });

    it("should return 401 on invalid password", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com", password: "wrong-password" })
        .expect(401);
    });

    it("should return 401 on non-existent user", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "nonexistent@test.com", password: "any-password" })
        .expect(401);
    });

    it("should return 400 when email is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ password: "e2e-test-password" })
        .expect(400);
    });

    it("should return 400 when password is missing", () => {
      return request(app.getHttpServer() as SupertestApp)
        .post("/api/users")
        .send({ email: "e2e-test@test.com" })
        .expect(400);
    });
  });
});
