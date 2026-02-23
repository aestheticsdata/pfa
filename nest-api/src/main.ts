import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { AppModule } from "./app.module";
import { AppConfig } from "@config/app.config";
import { formatRouteLog } from "@infrastructure/logger";
import { RedisService } from "@redis/redis.service";

import type { Application } from "express";

const SESSION_TTL_SECONDS = 10 * 60; // 10 minutes

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  (app.getHttpAdapter().getInstance() as Application).set("trust proxy", 1);

  const redisService = app.get<RedisService>(RedisService);
  const redisStore = new RedisStore({
    client: redisService.getClient(),
    prefix: "pfa:",
    ttl: SESSION_TTL_SECONDS,
  });

  // Cookie secure: en prod sans HTTPS, mettre COOKIE_SECURE=false dans .env
  const cookieSecure = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";

  app.use(
    session({
      name: "pfa.sid",
      store: redisStore,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
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

  app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
    const url = req.originalUrl ?? req.url ?? req.path ?? "";
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? req.socket?.remoteAddress ?? "?";
    const userAgent = (req.headers["user-agent"] ?? "unknown").slice(0, 60);
    console.log(formatRouteLog(req.method, url, "Nest", { ip, userAgent }));
    next();
  });

  await app.listen(appConfig.port);
}

void bootstrap();
