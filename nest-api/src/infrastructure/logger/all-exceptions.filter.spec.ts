import { BadRequestException, HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

import type { ArgumentsHost } from "@nestjs/common";
import type { Request, Response } from "express";
import type { PinoLogger } from "nestjs-pino";

/**
 * The filter's whole contract is the pair "log everything, change nothing" (IKN-1), and IKN-31
 * narrowed the first half: a 4xx is the API answering correctly, so it gets its type and its
 * message and not the dozen frames of Nest's router that a 404 was carrying in production.
 *
 * The duplicate-key assertions look pedantic and are not. `customProps` puts
 * `http.request.method` and `url.path` on every line of the request already; the filter used to
 * put them there a second time, which produced JSON that most parsers silently repair and a
 * strict ingester rejects outright.
 */
describe("AllExceptionsFilter", () => {
  let logged: Array<{ level: "warn" | "error"; fields: Record<string, unknown>; message: string }>;
  let filter: AllExceptionsFilter;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    logged = [];
    const record =
      (level: "warn" | "error") =>
      (fields: Record<string, unknown>, message: string): void => {
        logged.push({ level, fields, message });
      };
    filter = new AllExceptionsFilter({ warn: record("warn"), error: record("error") } as unknown as PinoLogger);

    json = jest.fn();
    status = jest.fn(() => ({ json }));
  });

  const host = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ status }) as unknown as Response,
        getRequest: () => ({ method: "GET", originalUrl: "/api/nope" }) as unknown as Request,
      }),
    }) as unknown as ArgumentsHost;

  const only = () => {
    expect(logged).toHaveLength(1);
    return logged[0];
  };

  it("writes a 4xx as its type and its message, with no stack trace", () => {
    filter.catch(new NotFoundException("Cannot GET /api/nope"), host());

    const line = only();
    expect(line.level).toBe("warn");
    expect(line.fields).toEqual({
      "error.type": "NotFoundException",
      "error.message": "Cannot GET /api/nope",
      "http.response.status_code": HttpStatus.NOT_FOUND,
    });
    expect(line.fields.err).toBeUndefined();
  });

  it("never repeats the request fields that customProps already wrote", () => {
    filter.catch(new BadRequestException("amount must be a number"), host());

    expect(Object.keys(only().fields)).not.toEqual(expect.arrayContaining(["http.request.method", "url.path"]));
  });

  it("keeps the whole exception on a 5xx, stack included", () => {
    const boom = new Error("connect ECONNREFUSED");
    filter.catch(boom, host());

    const line = only();
    expect(line.level).toBe("error");
    expect(line.fields.err).toBe(boom);
    expect((line.fields.err as Error).stack).toBeDefined();
    expect(line.fields["http.response.status_code"]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(line.message).toBe("unhandled exception");
  });

  it("keeps the whole exception on a 5xx raised as an HttpException too", () => {
    const unavailable = new HttpException("db is down", HttpStatus.SERVICE_UNAVAILABLE);
    filter.catch(unavailable, host());

    const line = only();
    expect(line.level).toBe("error");
    expect(line.fields.err).toBe(unavailable);
    expect(line.fields["http.response.status_code"]).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("reproduces the response Nest would have sent, for an HttpException", () => {
    const notFound = new NotFoundException("Cannot GET /api/nope");
    filter.catch(notFound, host());

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(notFound.getResponse());
  });

  it("reproduces Nest's own 500 for anything that is not an HttpException", () => {
    filter.catch("a string, thrown", host());

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({ statusCode: 500, message: "Internal server error" });
  });
});
