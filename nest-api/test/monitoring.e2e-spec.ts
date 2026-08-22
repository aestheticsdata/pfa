import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createE2eApp } from "./e2e-app";

import type { INestApplication } from "@nestjs/common";
import type { HealthReport } from "../src/monitoring/health.service";

/**
 * IKN-2 against the real app: the scrape endpoint and the health probe exactly as the Iknos
 * collector will consume them, plus the pool-saturation story the metrics exist to tell.
 */
describe("monitoring (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health answers 200 with one latency per dependency", async () => {
    const res = await request(app.getHttpServer()).get("/api/health").expect(200);

    const body = res.body as HealthReport;
    expect(body.status).toBe("ok");
    expect(body.checks.db.status).toBe("ok");
    expect(typeof body.checks.db.latencyMs).toBe("number");
    expect(body.checks.redis.status).toBe("ok");
    expect(typeof body.checks.redis.latencyMs).toBe("number");
    expect(typeof body.uptime).toBe("number");
    // No release marker in dev: null, never a value rebuilt from something else.
    expect(body.version).toBeNull();
  });

  it("GET /api/metrics serves Prometheus text labelled by route pattern, with 404s folded into unknown", async () => {
    const server = app.getHttpServer();
    await request(server).put("/api/spendings/12345").send({});
    await request(server).get("/api/definitely-not-a-route");
    // A request for exactly the prefix used to slip past consumer-mounted middleware.
    await request(server).get("/api");

    const res = await request(server).get("/api/metrics").expect(200);

    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain('route="/api/spendings/:id"');
    expect(res.text).toMatch(/http_requests_total\{method="GET",route="unknown",status_code="404"\} [2-9]/);
    expect(res.text).not.toContain("definitely-not-a-route");
    expect(res.text).toContain("http_request_duration_seconds_bucket");
    expect(res.text).toContain("nodejs_eventloop_lag_seconds");
  });

  it("never counts its own scrapes, whatever spelling reaches the route", async () => {
    const server = app.getHttpServer();
    // Express non-strict routing serves these through the same route as /api/metrics.
    await request(server).get("/api/metrics").expect(200);
    await request(server).get("/api/metrics/").expect(200);
    await request(server).get("/api/METRICS").expect(200);

    // Only a LATER scrape can prove the earlier ones were not counted: a scrape's own
    // observation would land on 'finish', after its text was generated.
    const res = await request(server).get("/api/metrics").expect(200);

    expect(res.text).not.toContain('route="/api/metrics"');
  });

  it("db_pool_connections reads 10 active with acquirers waiting while the pool is saturated", async () => {
    const prisma = app.get(PrismaService);
    // `.then()` matters: $queryRaw returns a lazy PrismaPromise that only executes once awaited.
    const inflight = Array.from({ length: 14 }, () => prisma.$queryRaw`SELECT SLEEP(0.5)`.then((rows) => rows));
    // Give the fourteen queries time to claim the ten slots before scraping.
    await new Promise((resolve) => setTimeout(resolve, 150));

    const res = await request(app.getHttpServer()).get("/api/metrics").expect(200);
    await Promise.all(inflight);

    expect(res.text).toContain('db_pool_connections{state="active"} 10');
    expect(res.text).toMatch(/db_pool_connections\{state="waiting"\} [1-9]/);
  });
});
