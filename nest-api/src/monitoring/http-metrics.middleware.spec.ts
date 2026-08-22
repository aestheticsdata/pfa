import { EventEmitter } from "node:events";
import { HttpMetricsMiddleware } from "./http-metrics.middleware";

import type { NextFunction, Request, Response } from "express";
import type { MetricsService } from "./metrics.service";

/**
 * A middleware rather than the interceptor the ticket sketched (IKN-2): an interceptor only runs
 * for matched handlers, so a request that matched no route — the 404s of a path scan — would
 * never be counted and the `unknown` fallback could never fire. Registered with `app.use` on the
 * raw Express app (see main.ts), it sees every request, and on `finish`/`close` it sees the
 * status the exception filter actually wrote.
 *
 * The self-scrape exclusion is decided at finish time from the *matched route pattern*, not from
 * the request path: inside a mounted middleware `req.path` is mount-relative, and Express serves
 * `/api/metrics/` and case variants for the same route — the canonical pattern covers them all.
 */
describe("HttpMetricsMiddleware", () => {
  let observations: Array<{ method: string; route: string; statusCode: number; seconds: number }>;
  let middleware: HttpMetricsMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    observations = [];
    const metrics = {
      observeHttpRequest: (method: string, route: string, statusCode: number, seconds: number) => {
        observations.push({ method, route, statusCode, seconds });
      },
    } as unknown as MetricsService;
    middleware = new HttpMetricsMiddleware(metrics);
    next = jest.fn();
  });

  const makeReq = (overrides: Partial<Request>): Request =>
    ({ method: "GET", path: "/api/dashboard", baseUrl: "", ...overrides }) as unknown as Request;

  const makeRes = (statusCode: number): Response => {
    const res = new EventEmitter() as unknown as Response;
    res.statusCode = statusCode;
    return res;
  };

  const finish = (res: Response) => (res as unknown as EventEmitter).emit("finish");
  const close = (res: Response) => (res as unknown as EventEmitter).emit("close");

  it("labels a matched request with its route pattern, not the raw url", () => {
    const req = makeReq({ path: "/api/spendings/42", route: { path: "/api/spendings/:id" } } as Partial<Request>);
    const res = makeRes(200);

    middleware.use(req, res, next as NextFunction);
    finish(res);

    expect(next).toHaveBeenCalled();
    expect(observations).toEqual([
      { method: "GET", route: "/api/spendings/:id", statusCode: 200, seconds: expect.any(Number) },
    ]);
  });

  it("measures a plausible duration", () => {
    const req = makeReq({ route: { path: "/api/dashboard" } } as Partial<Request>);
    const res = makeRes(200);

    middleware.use(req, res, next as NextFunction);
    finish(res);

    expect(observations[0].seconds).toBeGreaterThanOrEqual(0);
    expect(observations[0].seconds).toBeLessThan(1);
  });

  it("folds an unmatched request into the unknown label, never the requested url", () => {
    const req = makeReq({ path: "/api/wp-admin/setup.php" });
    const res = makeRes(404);

    middleware.use(req, res, next as NextFunction);
    finish(res);

    expect(observations).toEqual([{ method: "GET", route: "unknown", statusCode: 404, seconds: expect.any(Number) }]);
  });

  it("folds Nest's wildcard catch-all route into unknown as well", () => {
    // Nest 11 on Express 5 answers unmatched paths under the global prefix through a catch-all
    // route, so a 404 arrives with `/api/{*path}` as its pattern — an implementation detail,
    // not a route of the app.
    const req = makeReq({ path: "/api/wp-admin/setup.php", route: { path: "/api/{*path}" } } as Partial<Request>);
    const res = makeRes(404);

    middleware.use(req, res, next as NextFunction);
    finish(res);

    expect(observations).toEqual([{ method: "GET", route: "unknown", statusCode: 404, seconds: expect.any(Number) }]);
  });

  it("prefixes the pattern with baseUrl when the route was mounted on a router", () => {
    const req = makeReq({ baseUrl: "/api", route: { path: "/spendings/:id" } } as Partial<Request>);
    const res = makeRes(200);

    middleware.use(req, res, next as NextFunction);
    finish(res);

    expect(observations[0].route).toBe("/api/spendings/:id");
  });

  it("does not count a request that resolved to the /api/metrics route, whatever url spelling reached it", () => {
    // Express non-strict routing serves /api/metrics/ and case variants through the same route,
    // and inside a mounted middleware req.path is mount-relative — so the exclusion keys on the
    // matched pattern, the one spelling all variants share.
    for (const path of ["/api/metrics", "/api/metrics/", "/api/METRICS"]) {
      const req = makeReq({ path, route: { path: "/api/metrics" } } as Partial<Request>);
      const res = makeRes(200);

      middleware.use(req, res, next as NextFunction);
      finish(res);
    }

    expect(next).toHaveBeenCalledTimes(3);
    expect(observations).toEqual([]);
  });

  it("counts an aborted request on close, when finish never fires", () => {
    const req = makeReq({ route: { path: "/api/dashboard" } } as Partial<Request>);
    const res = makeRes(200);

    middleware.use(req, res, next as NextFunction);
    close(res);

    expect(observations).toHaveLength(1);
    expect(observations[0].route).toBe("/api/dashboard");
  });

  it("records a normally completed request only once even though close follows finish", () => {
    const req = makeReq({ route: { path: "/api/dashboard" } } as Partial<Request>);
    const res = makeRes(200);

    middleware.use(req, res, next as NextFunction);
    finish(res);
    close(res);

    expect(observations).toHaveLength(1);
  });
});
