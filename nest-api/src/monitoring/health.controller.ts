import { Controller, Get, Res } from "@nestjs/common";
import { HealthService } from "./health.service";

import type { Response } from "express";
import type { HealthReport } from "./health.service";

/**
 * `GET /api/health` (IKN-2). The body is the full report either way; the status code carries the
 * verdict — 503 on a failed dependency, because a probe that always reads 200 detects nothing.
 * No session guard: the prober has no session, and the response holds no user data.
 */
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const report = await this.healthService.check();
    res.status(report.status === "ok" ? 200 : 503);
    return report;
  }
}
