import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
import { AppConfig } from "@config/app.config";
import { LEGACY_PROXY } from "@infrastructure/proxy/legacy-proxy.provider";
import { formatRouteLog } from "@infrastructure/logger";

// Prefixes still served by the legacy Express API.
// Remove a prefix from this list once its routes are migrated to NestJS.
// Use { path, except: { method } } to exclude specific methods (handled by Nest).
const LEGACY_PREFIXES: (string | { path: string; except: { method: string } })[] = [
  "/users/add",
  "/users/resetpassword",
  "/categories",
  { path: "/spendings", except: { method: "GET" } },
  "/recurrings",
  "/dashboard",
  "/monthlystats",
  "/weeklystats",
  "/statistics",
];

function shouldProxyToLegacy(path: string, method: string): boolean {
  return LEGACY_PREFIXES.some((entry) => {
    const prefix = typeof entry === "string" ? entry : entry.path;
    if (!path.startsWith(prefix)) return false;
    // Exclude only when path matches exactly (e.g. GET /spendings list)
    if (typeof entry === "object" && entry.except?.method === method && path === prefix) {
      return false;
    }
    return true;
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");
  const proxy = app.get(LEGACY_PROXY);

  // Same URL structure in dev and prod: global prefix /api.
  // Nginx forwards /api/* as-is (no trailing slash in proxy_pass).
  app.setGlobalPrefix("api");

  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    const target = shouldProxyToLegacy(req.path, req.method) ? "Express" : "Nest";
    const url = req.originalUrl ?? req.url ?? req.path ?? "";
    console.log(formatRouteLog(req.method, url, target));
    if (target === "Express") {
      proxy(req, res, next);
      return;
    }
    next();
  });

  await app.listen(appConfig.port);
}

void bootstrap();
