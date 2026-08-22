import { Injectable } from "@nestjs/common";
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";
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
 *
 * A dedicated registry rather than prom-client's global one: nothing else in the process can
 * leak series in, and tests can build as many instances as they like.
 */
@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<"method" | "route" | "status_code">;
  private readonly httpRequestDuration: Histogram<"method" | "route">;

  constructor(private readonly prisma: PrismaService) {
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

  observeHttpRequest(method: string, route: string, statusCode: number, seconds: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route }, seconds);
  }

  metricsText(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
