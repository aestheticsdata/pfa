import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { HttpMetricsMiddleware } from "./http-metrics.middleware";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

/**
 * What the API exposes about itself (IKN-2): `GET /api/metrics` for the scraper and a
 * `GET /api/health` that actually probes its dependencies. PrismaModule and RedisModule are both
 * global, so nothing is imported here.
 *
 * HttpMetricsMiddleware is a provider but is NOT mounted through a consumer: mounted under the
 * global prefix it would miss a request for exactly `/api` and everything outside the prefix, so
 * unmatched 404s would escape the `unknown` count. main.ts (and the e2e helper) register it with
 * `app.use` on the raw Express app instead, ahead of everything else.
 */
@Module({
  controllers: [HealthController, MetricsController],
  providers: [MetricsService, HealthService, HttpMetricsMiddleware],
})
export class MonitoringModule {}
