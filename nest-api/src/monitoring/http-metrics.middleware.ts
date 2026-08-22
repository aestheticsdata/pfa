import { Injectable, NestMiddleware } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

import type { NextFunction, Request, Response } from "express";

/**
 * Feeds `http_requests_total` and `http_request_duration_seconds` (IKN-2).
 *
 * A middleware and not the interceptor the ticket sketched: an interceptor only wraps matched
 * handlers, so unmatched 404s would never reach it and the required `unknown` fallback could
 * never fire. It is registered with `app.use` on the raw Express app (main.ts) rather than
 * through a consumer: consumer mounting under the global prefix skips a request for exactly
 * `/api` and everything outside the prefix, and hands the middleware a mount-relative
 * `req.path` that lies about what was asked.
 *
 * Everything is decided when the response ends — `finish`, or `close` for a client that gave up
 * (an aborted request must still count: during a pool pile-up those are precisely the requests
 * that tell the story). The route label is Express's matched pattern (`/api/spendings/:id`),
 * never the raw URL: one series per route, not one per scanned path. The `/api/metrics`
 * exclusion keys on that pattern too, because Express serves `/api/metrics/` and case variants
 * through the same route — the canonical pattern is the one spelling they all share.
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    let recorded = false;
    const record = () => {
      if (recorded) {
        return;
      }
      recorded = true;

      // `req.route` is only set once a route has matched — by now it is either there or the
      // request never matched anything. A wildcard pattern is Nest's catch-all answering a 404
      // under the global prefix, not a route of the app, so it counts as unmatched too.
      const routePath: unknown = (req as unknown as { route?: { path?: unknown } }).route?.path;
      const pattern = typeof routePath === "string" ? routePath : undefined;
      const route = pattern && !pattern.includes("*") ? `${req.baseUrl ?? ""}${pattern}` : "unknown";
      if (route === "/api/metrics") {
        return;
      }

      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      this.metrics.observeHttpRequest(req.method, route, res.statusCode, seconds);
    };

    res.on("finish", record);
    res.on("close", record);
    next();
  }
}
