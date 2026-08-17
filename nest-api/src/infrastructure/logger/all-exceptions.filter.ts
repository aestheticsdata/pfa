import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";

/** A plain number rather than the enum: `status` is a number, and comparing the two is a lint error. */
const SERVER_ERROR = 500;

/**
 * Logs every exception, and changes no response.
 *
 * Before this filter the API had none at all: an unhandled error produced Nest's default 500 and
 * not one line anywhere, so the only evidence a request had failed was the client saying so.
 *
 * **The response is reproduced exactly as Nest would have sent it.** That constraint is what
 * makes this safe to add to a running application: an `HttpException` keeps its status and its
 * body verbatim, anything else is a 500 with Nest's own wording. The filter observes; it does not
 * participate.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : { statusCode: status, message: "Internal server error" };

    // A 4xx is the API working: the client asked for something it may not have. Logging those at
    // error level would bury the 5xx, which are the ones nobody chose.
    const level = status >= SERVER_ERROR ? "error" : "warn";

    this.logger[level](
      {
        // `err` is pino's conventional key, and the ECS formatter turns it into error.type,
        // error.message and error.stack_trace without any mapping here.
        err: exception,
        "http.response.status_code": status,
        "http.request.method": req?.method,
        "url.path": req?.originalUrl ?? req?.url,
      },
      isHttp ? exception.message : "unhandled exception",
    );

    res.status(status).json(body);
  }
}
