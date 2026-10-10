import "reflect-metadata";
import { ConsoleLogger, StandardSchemaValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "#app/app.module.js";
import { sessionMiddleware } from "#app/infrastructure/session.js";
import { RedisService } from "#app/redis/redis.service.js";

import type { NestExpressApplication } from "@nestjs/platform-express";
import type { AppConfig } from "#app/config/interfaces/configTypes.js";

/**
 * Loopback only, always: the back-office API is reached by its own Next server on ks-b and by
 * nothing else — nginx routes `bots.1991computer.com` to the front, never here (PFA-127).
 */
const BIND_HOST = "127.0.0.1";

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  // One JSON object per line (Nest 12 structured params), the shape Iknos ingests.
  logger: new ConsoleLogger({ json: process.env.NODE_ENV === "production", prefix: "bots-api" }),
});
// The Next server forwards nginx's X-Forwarded-For: the rightmost hop is the client nginx saw.
app.set("trust proxy", 1);
app.use(sessionMiddleware(app.get(RedisService), process.env.SESSION_SECRET ?? ""));
app.useGlobalPipes(new StandardSchemaValidationPipe());
app.setGlobalPrefix("api");
// Nest 12 drains in-flight requests on SIGTERM: a PM2 reload never cuts a control action in half.
app.enableShutdownHooks();

await app.listen(app.get(ConfigService).getOrThrow<AppConfig>("app").port, BIND_HOST);
