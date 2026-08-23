import { buildLoggerParams } from "./logger.config";

import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * The one rule in this file that can fail silently, and did.
 *
 * The probe exclusion used to live in `autoLogging.ignore`, which pino-http hands the request
 * alone on the way in — so it dropped a probe that answered 500 as readily as one that answered
 * 200, and `/api/health` and `/api/metrics` became the two routes whose failure nothing recorded
 * (IKN-51). Nothing about that was visible from the outside: the symptom of the bug is an absence.
 */
describe("buildLoggerParams — customLogLevel", () => {
  const level = (url: string, statusCode: number): string => {
    const params = buildLoggerParams();
    const custom = (params.pinoHttp as { customLogLevel: (req: IncomingMessage, res: ServerResponse) => string })
      .customLogLevel;
    return custom({ url } as IncomingMessage, { statusCode } as ServerResponse);
  };

  it.each([
    ["/api/health", 200],
    ["/api/metrics", 200],
    ["/api/health", 204],
    ["/api/health?from=curl", 200],
  ])("says nothing about a probe that answered: %s -> %i", (url, status) => {
    expect(level(url, status)).toBe("silent");
  });

  it.each([
    ["/api/health", 500],
    ["/api/health", 404],
    ["/api/health", 503],
    ["/api/metrics", 500],
    ["/api/metrics", 302],
  ])("keeps a probe that did not: %s -> %i", (url, status) => {
    expect(level(url, status)).toBe("info");
  });

  it.each([
    ["/api/spendings", 200],
    ["/api/spendings", 404],
    ["/api/dashboard", 500],
    ["/", 200],
  ])("leaves every other route on info, whatever it answered: %s -> %i", (url, status) => {
    expect(level(url, status)).toBe("info");
  });

  it("no longer silences anything on the way in", () => {
    const pinoHttp = buildLoggerParams().pinoHttp as { autoLogging?: { ignore?: unknown } };
    expect(pinoHttp.autoLogging?.ignore).toBeUndefined();
  });
});
