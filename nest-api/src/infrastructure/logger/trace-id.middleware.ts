import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/**
 * Copies the request id onto every line the request produces, under the ECS name `trace.id`.
 *
 * pino-http puts the id on the access line and nowhere else, so without this a log written from
 * a service in the middle of a request cannot be tied back to the call that caused it — which is
 * the single thing a request id exists for.
 *
 * `assign` writes into nestjs-pino's AsyncLocalStorage, so it reaches every subsequent line in
 * the same request without anything having to be threaded through the call stack.
 *
 * The name is `trace.id` rather than `request.id` on purpose: it is the field an OpenTelemetry
 * SDK would populate, so adding one later changes nothing downstream.
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const id = (req as Request & { id?: unknown }).id;
    if (typeof id === "string") this.logger.assign({ "trace.id": id });

    next();
  }
}
