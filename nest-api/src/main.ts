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
// Use { path, except: { methods, pathPrefix? } } to exclude (pathPrefix = match by prefix, else exact).
const LEGACY_PREFIXES: (string | { path: string; except: { methods: string[]; pathPrefix?: boolean } })[] = [
  "/users/add",
  "/users/resetpassword",
  "/categories",
  { path: "/spendings", except: { methods: ["GET", "POST"] } },
  { path: "/spendings/upload", except: { methods: ["GET", "POST"], pathPrefix: true } },
  "/recurrings",
  "/dashboard",
  "/monthlystats",
  "/weeklystats",
  "/statistics",
];

function shouldProxyToLegacy(path: string, method: string): boolean {
  // PUT /spendings/:id → Nest (but NOT PUT /spendings/upload which is still Express)
  if (method === "PUT" && /^\/spendings\/(?!upload\b)/.test(path)) {
    return false;
  }

  // First: if any entry says "don't proxy" (except matches), use Nest
  const shouldNotProxy = LEGACY_PREFIXES.some((entry) => {
    if (typeof entry === "string") return false;
    const prefix = entry.path;
    if (!path.startsWith(prefix)) return false;
    if (entry.except?.methods?.includes(method)) {
      const pathMatches = entry.except.pathPrefix ? path.startsWith(prefix) : path === prefix;
      if (pathMatches) return true;
    }
    return false;
  });
  if (shouldNotProxy) return false;

  // Second: if any prefix matches, proxy to Express
  return LEGACY_PREFIXES.some((entry) => {
    const prefix = typeof entry === "string" ? entry : entry.path;
    return path.startsWith(prefix);
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
    const path = req.path.startsWith("/api") ? req.path.slice(4) || "/" : req.path;
    const target = shouldProxyToLegacy(path, req.method) ? "Express" : "Nest";
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
