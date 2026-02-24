import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { AppModule } from "../src/app.module";
import { RedisService } from "../src/redis/redis.service";

const SESSION_TTL_SECONDS = 10 * 60;

/**
 * Creates a Nest app configured for e2e tests with session middleware (same as main.ts).
 * Requires Redis to be running (e.g. redis-server).
 */
export async function createE2eApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  const redisService = app.get(RedisService);
  const redisStore = new RedisStore({
    client: redisService.getClient(),
    prefix: "pfa:",
    ttl: SESSION_TTL_SECONDS,
  });

  app.use(
    session({
      name: "pfa.sid",
      store: redisStore,
      secret: process.env.SESSION_SECRET ?? "e2e-test-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      proxy: true,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS * 1000,
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix("api");
  await app.init();

  return app;
}
