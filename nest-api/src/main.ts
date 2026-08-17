import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AppConfig } from "@config/app.config";
import { RedisService } from "@redis/redis.service";

import type { Application } from "express";

const SESSION_TTL_SECONDS = 10 * 60; // 10 minutes

async function bootstrap() {
  // bufferLogs holds Nest's startup lines until pino is attached, so the first thing written to
  // stdout is already ECS rather than Nest's coloured console format.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  (app.getHttpAdapter().getInstance() as Application).set("trust proxy", 1);

  const redisService = app.get<RedisService>(RedisService);
  const redisStore = new RedisStore({
    client: redisService.getClient(),
    prefix: "pfa:",
    ttl: SESSION_TTL_SECONDS,
  });

  // Cookie secure: en prod sans HTTPS, mettre COOKIE_SECURE=false dans .env
  const cookieSecure = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";

  // Registered before Nest initialises, so it runs ahead of the request logger — which is what
  // lets the access line carry `user.id`.
  app.use(
    session({
      name: "pfa.sid",
      store: redisStore,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      proxy: true, // requis pour cookie Secure derrière reverse proxy
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS * 1000,
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");

  app.setGlobalPrefix("api");

  // The hand-rolled `console.log` access line that used to live here is gone (IKN-1). pino-http
  // replaces it with one ECS object per request, carrying the method, path, query, status code,
  // duration, client address, user agent and — when signed in — the user id.
  await app.listen(appConfig.port);
}

void bootstrap();
