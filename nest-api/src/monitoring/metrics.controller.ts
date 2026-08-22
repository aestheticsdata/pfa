import { Controller, Get, Res } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

import type { Response } from "express";

/**
 * `GET /api/metrics` (IKN-2), Prometheus text format. No session guard — the Iknos collector
 * scrapes 127.0.0.1:6100 directly; the public vhost denies this path at nginx (see DEPLOY.md).
 */
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async metrics(@Res({ passthrough: true }) res: Response): Promise<string> {
    res.setHeader("Content-Type", this.metricsService.contentType);
    return this.metricsService.metricsText();
  }
}
