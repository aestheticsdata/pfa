import { MetricsController } from "./metrics.controller";

import type { Response } from "express";
import type { MetricsService } from "./metrics.service";

/**
 * GET /api/metrics (IKN-2): the registry's text, under the registry's content type — the two
 * things a Prometheus-format scraper checks before parsing.
 */
describe("MetricsController", () => {
  it("serves the registry text with the Prometheus content type", async () => {
    const metrics = {
      metricsText: () => Promise.resolve("# HELP http_requests_total ...\n"),
      contentType: "text/plain; version=0.0.4; charset=utf-8",
    } as unknown as MetricsService;
    const setHeader = jest.fn();
    const res = { setHeader } as unknown as Response;

    const body = await new MetricsController(metrics).metrics(res);

    expect(setHeader).toHaveBeenCalledWith("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    expect(body).toContain("http_requests_total");
  });
});
