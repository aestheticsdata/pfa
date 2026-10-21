import type { HttpObservation, UserKind } from "@monitoring/interfaces/monitoringTypes";
import { USER_KIND } from "@monitoring/user-kind";
import { Injectable } from "@nestjs/common";
import { RedisService } from "@redis/redis.service";
import { Counter, collectDefaultMetrics, Gauge, Histogram, Registry } from "prom-client";
import { PrismaService } from "../prisma/prisma.service";
import { readReleaseMarker } from "./release-marker";

/**
 * The Prometheus registry behind `GET /api/metrics` (IKN-2).
 *
 * Iknos scrapes this text from localhost every 15 s; the day a real Prometheus is installed it
 * points at the same URL and the Iknos scraper is deleted. Every series here is therefore
 * contract, not decoration:
 *
 * - `http_requests_total` / `http_request_duration_seconds` label by **route pattern**
 *   (`/api/spendings/:id`), never the raw URL — raw URLs would mint one series per scanned path
 *   and make the metrics table unusable.
 * - `db_pool_connections` is the cause-side of the mockup's outage story: a pool at 10/10 while
 *   a route returns 500. Absent until the pool exists, never invented.
 * - `app_build_info` carries the deployed release; without a marker the series is absent and the
 *   UI shows `—` (Iknos UI spec §8.7).
 * - `spendings_created_total` and `active_sessions` are the business side (PFA-212), labelled by
 *   `user_kind` only, so the bots' traffic can be read apart from people's without the text ever
 *   naming anyone.
 *
 * A dedicated registry rather than prom-client's global one: nothing else in the process can
 * leak series in, and tests can build as many instances as they like.
 */
@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<"method" | "route" | "status_code">;
  private readonly httpRequestDuration: Histogram<"method" | "route">;
  private readonly spendingsCreatedTotal: Counter<"user_kind">;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "HTTP requests handled, by method, route pattern and status code.",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds, by method and route pattern.",
      labelNames: ["method", "route"],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    const poolSource = this.prisma;
    new Gauge({
      name: "db_pool_connections",
      help: "MariaDB connection pool occupancy: active and idle connections, waiting acquirers.",
      labelNames: ["state"],
      registers: [this.registry],
      collect() {
        const stats = poolSource.getPoolStats();
        if (!stats) {
          return;
        }
        this.set({ state: "active" }, stats.active);
        this.set({ state: "idle" }, stats.idle);
        this.set({ state: "waiting" }, stats.waiting);
      },
    });

    this.spendingsCreatedTotal = new Counter({
      name: "spendings_created_total",
      help: "Spendings created since the process started, by user kind.",
      labelNames: ["user_kind"],
      registers: [this.registry],
    });
    // Both series exist from the first scrape: a counter that only appears on its first increment
    // makes `rate()` blind to that first one.
    for (const kind of Object.values(USER_KIND)) {
      this.spendingsCreatedTotal.inc({ user_kind: kind }, 0);
    }

    const sessionSource = this.redis;
    new Gauge({
      name: "active_sessions",
      help: "Signed-in sessions held in Redis, by user kind.",
      labelNames: ["user_kind"],
      registers: [this.registry],
      async collect() {
        // Redis down must not take the whole scrape with it: the series goes absent for this
        // scrape, and /api/health is the one that reports the outage.
        this.reset();
        try {
          const counts = await sessionSource.countActiveSessions();
          this.set({ user_kind: USER_KIND.real }, counts.real);
          this.set({ user_kind: USER_KIND.synthetic }, counts.synthetic);
        } catch {
          // Absent, never a stale or invented value.
        }
      },
    });

    const marker = readReleaseMarker();
    if (marker) {
      new Gauge({
        name: "app_build_info",
        help: "Deployed release, as labels on a constant 1.",
        labelNames: ["version", "commit"],
        registers: [this.registry],
      }).set({ version: marker.version, commit: marker.commit }, 1);
    }
  }

  observeHttpRequest({ method, route, statusCode, seconds }: HttpObservation): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route }, seconds);
  }

  countSpendingsCreated(kind: UserKind, count = 1): void {
    this.spendingsCreatedTotal.inc({ user_kind: kind }, count);
  }

  metricsText(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
