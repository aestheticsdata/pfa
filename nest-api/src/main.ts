import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
import { AppConfig } from "@config/app.config";
import { LEGACY_PROXY } from "@infrastructure/proxy/legacy-proxy.provider";

// Prefixes still served by the legacy Express API.
// Remove a prefix from this list once its routes are migrated to NestJS.
const LEGACY_PREFIXES = [
  "/users",
  "/categories",
  "/spendings",
  "/recurrings",
  "/dashboard",
  "/monthlystats",
  "/weeklystats",
  "/statistics",
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");
  const proxy = app.get(LEGACY_PROXY);

  // No global prefix — the server sits behind nginx which strips /api in prod.
  // In local, the frontend also calls routes at root (e.g. /spendings, /health).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (LEGACY_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
      proxy(req, res, next);
      return;
    }
    next();
  });

  await app.listen(appConfig.port);
}

void bootstrap();
