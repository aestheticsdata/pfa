import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

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

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : { statusCode: status, message: "Internal server error" };

    // A 4xx is the API working: the client asked for something it may not have. Logging those at
    // error level would bury the 5xx, which are the ones nobody chose.
    const isServerError = status >= SERVER_ERROR;
    const level = isServerError ? "error" : "warn";

    /**
     * How much of the exception is worth writing down, which is not the same answer twice.
     *
     * A 5xx is nobody's choice and the frames *are* the investigation, so the exception goes
     * through under `err` — pino's conventional key, which the ECS formatter turns into
     * error.type, error.message and error.stack_trace without any mapping here.
     *
     * A 4xx is the API answering correctly. Its stack is a dozen frames of Nest's router
     * describing the framework rather than the request, and a 404 measured in prod carried ten of
     * them for a line that says nothing the route did not. The type and the message are named by
     * hand instead, and the pile is dropped.
     *
     * The `isHttp` half is not belt and braces: only an `HttpException` can produce a status below
     * 500 here — anything else is forced to one above — and it is what lets `.name` be read
     * without a cast.
     */
    const error =
      isHttp && !isServerError
        ? { "error.type": exception.name, "error.message": exception.message }
        : { err: exception };

    this.logger[level](
      {
        ...error,
        // `http.request.method` and `url.path` are deliberately absent. `customProps` already puts
        // both on every line of the request, and repeating them here produced JSON with duplicate
        // keys: most parsers keep the last one, a strict ingester rejects the line. The status
        // code stays — it is the one field of the three `customProps` never sets.
        "http.response.status_code": status,
      },
      isHttp ? exception.message : "unhandled exception",
    );

    res.status(status).json(body);
  }
}
