import { HealthController } from "./health.controller";

import type { Response } from "express";
import type { HealthReport, HealthService } from "./health.service";

/**
 * The status-code half of the health contract (IKN-2): 200 when everything answers, 503 the
 * moment a dependency fails — without it, an uptime probe reading /api/health detects nothing.
 */
describe("HealthController", () => {
  const report = (status: HealthReport["status"]): HealthReport => ({
    status,
    uptime: 12,
    version: null,
    checks: {
      db: { status: "ok", latencyMs: 3 },
      redis: { status: status === "ok" ? "ok" : "error", latencyMs: 1 },
    },
  });

  const makeRes = () => {
    const status = jest.fn();
    status.mockReturnValue({ statusCode: 200, status });
    return { status, res: { statusCode: 200, status } as unknown as Response };
  };

  const build = (r: HealthReport) =>
    new HealthController({ check: () => Promise.resolve(r) } as unknown as HealthService);

  it("answers 200 with the report when everything is ok", async () => {
    const { status, res } = makeRes();
    const body = await build(report("ok")).health(res);

    expect(status).toHaveBeenCalledWith(200);
    expect(body.status).toBe("ok");
    expect(body.checks.db.latencyMs).toBe(3);
  });

  it("answers 503 when a dependency is degraded", async () => {
    const { status, res } = makeRes();
    const body = await build(report("degraded")).health(res);

    expect(status).toHaveBeenCalledWith(503);
    expect(body.status).toBe("degraded");
  });
});
