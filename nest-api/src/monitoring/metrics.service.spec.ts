import { MetricsService } from "./metrics.service";
import { readReleaseMarker } from "./release-marker";

import type { PrismaService } from "../prisma/prisma.service";
import type { DbPoolStats } from "../prisma/db-pool-stats";

jest.mock("./release-marker");

const mockedReadReleaseMarker = readReleaseMarker as jest.MockedFunction<typeof readReleaseMarker>;

/**
 * The Prometheus registry Iknos scrapes (IKN-2). The shape of every series here is contract:
 * the collector stores what this text says, and the Service view renders it.
 */
describe("MetricsService", () => {
  let stats: DbPoolStats | null;
  const prisma = { getPoolStats: () => stats } as unknown as PrismaService;

  beforeEach(() => {
    stats = null;
    mockedReadReleaseMarker.mockReturnValue(null);
  });

  const build = () => new MetricsService(prisma);

  it("serves the default node metrics", async () => {
    const text = await build().metricsText();

    expect(text).toContain("nodejs_eventloop_lag_seconds");
    expect(text).toContain("process_resident_memory_bytes");
  });

  it("counts http requests by method, route pattern and status code", async () => {
    const service = build();
    service.observeHttpRequest("GET", "/api/spendings/:id", 200, 0.03);
    service.observeHttpRequest("GET", "/api/spendings/:id", 200, 0.05);
    service.observeHttpRequest("POST", "/api/spendings", 500, 1.2);

    const text = await service.metricsText();

    expect(text).toContain('http_requests_total{method="GET",route="/api/spendings/:id",status_code="200"} 2');
    expect(text).toContain('http_requests_total{method="POST",route="/api/spendings",status_code="500"} 1');
  });

  it("observes durations in a histogram with the agreed buckets, without a status label", async () => {
    const service = build();
    service.observeHttpRequest("GET", "/api/dashboard", 200, 0.07);

    const text = await service.metricsText();

    for (const le of ["0.01", "0.05", "0.1", "0.25", "0.5", "1", "2.5", "5"]) {
      expect(text).toContain(`http_request_duration_seconds_bucket{le="${le}",method="GET",route="/api/dashboard"}`);
    }
    expect(text).toContain('http_request_duration_seconds_count{method="GET",route="/api/dashboard"} 1');
    expect(text).not.toContain(
      'http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/dashboard",status_code',
    );
  });

  it("reports the db pool as three gauges when the pool is known", async () => {
    stats = { active: 10, idle: 0, waiting: 4 };

    const text = await build().metricsText();

    expect(text).toContain('db_pool_connections{state="active"} 10');
    expect(text).toContain('db_pool_connections{state="idle"} 0');
    expect(text).toContain('db_pool_connections{state="waiting"} 4');
  });

  it("omits the db pool series while the pool is not yet known", async () => {
    stats = null;

    const text = await build().metricsText();

    expect(text).not.toContain("db_pool_connections{");
  });

  it("exposes app_build_info from the release marker", async () => {
    mockedReadReleaseMarker.mockReturnValue({ version: "2.19.0", commit: "a41c9e2" });

    const text = await build().metricsText();

    expect(text).toContain('app_build_info{version="2.19.0",commit="a41c9e2"} 1');
  });

  it("has no app_build_info series without a release marker", async () => {
    const text = await build().metricsText();

    expect(text).not.toContain("app_build_info");
  });

  it("names the Prometheus text content type", () => {
    expect(build().contentType).toContain("text/plain");
  });
});
