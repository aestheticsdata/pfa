import { HealthService } from "./health.service";
import { readReleaseMarker } from "./release-marker";

import type { PrismaService } from "../prisma/prisma.service";
import type { RedisService } from "@redis/redis.service";

jest.mock("./release-marker");

const mockedReadReleaseMarker = readReleaseMarker as jest.MockedFunction<typeof readReleaseMarker>;

/**
 * The real /api/health (IKN-2): one probe per dependency, each with its own latency, because the
 * Iknos pills (`mysql 3ms`, `redis 1ms`) need to say which of the two is dragging. A failed
 * dependency makes the whole report `degraded` — the controller turns that into a 503.
 */
describe("HealthService", () => {
  let dbQuery: jest.Mock;
  let redisPing: jest.Mock;

  const build = () => {
    const prisma = { $queryRaw: dbQuery } as unknown as PrismaService;
    const redis = { getClient: () => ({ ping: redisPing }) } as unknown as RedisService;
    return new HealthService(prisma, redis);
  };

  beforeEach(() => {
    mockedReadReleaseMarker.mockReturnValue(null);
    dbQuery = jest.fn().mockResolvedValue([{ 1: 1 }]);
    redisPing = jest.fn().mockResolvedValue("PONG");
  });

  it("reports ok with one latency per dependency when both answer", async () => {
    const report = await build().check();

    expect(report.status).toBe("ok");
    expect(report.checks.db.status).toBe("ok");
    expect(report.checks.db.latencyMs).toBeGreaterThanOrEqual(0);
    expect(report.checks.redis.status).toBe("ok");
    expect(report.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
    expect(report.uptime).toBeGreaterThanOrEqual(0);
  });

  it("degrades when the database probe fails, and still probes redis", async () => {
    dbQuery.mockRejectedValue(new Error("pool exhausted"));

    const report = await build().check();

    expect(report.status).toBe("degraded");
    expect(report.checks.db).toMatchObject({ status: "error", error: "unavailable" });
    expect(report.checks.redis.status).toBe("ok");
  });

  it("degrades when redis fails", async () => {
    redisPing.mockRejectedValue(new Error("connection refused"));

    const report = await build().check();

    expect(report.status).toBe("degraded");
    expect(report.checks.redis).toMatchObject({ status: "error", error: "unavailable" });
    expect(report.checks.db.status).toBe("ok");
  });

  it("never echoes raw driver error messages into the public body", async () => {
    // /api/health is public; a Prisma failure names internal hosts and users
    // ("Can't reach database server at `localhost:3306`") — that stays in the server log.
    dbQuery.mockRejectedValue(new Error("Can't reach database server at `localhost:3306`, user `root`"));

    const report = await build().check();

    expect(JSON.stringify(report)).not.toContain("localhost:3306");
    expect(JSON.stringify(report)).not.toContain("root");
    expect(report.checks.db.error).toBe("unavailable");
  });

  it("times out a hung dependency instead of hanging the probe", async () => {
    dbQuery.mockImplementation(() => new Promise(() => undefined));

    const report = await build().check(20);

    expect(report.status).toBe("degraded");
    expect(report.checks.db.status).toBe("error");
    expect(report.checks.db.error).toBe("timed out");
    expect(report.checks.redis.status).toBe("ok");
  });

  it("carries the release marker version, or null without one", async () => {
    expect((await build().check()).version).toBeNull();

    mockedReadReleaseMarker.mockReturnValue({ version: "2.19.0", commit: "a41c9e2" });
    expect((await build().check()).version).toBe("2.19.0");
  });

  it("does not attach an error field to a healthy check", async () => {
    const report = await build().check();

    expect(report.checks.db).not.toHaveProperty("error");
    expect(report.checks.redis).not.toHaveProperty("error");
  });
});
