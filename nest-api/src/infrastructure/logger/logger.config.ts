import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ecsFormat from "@elastic/ecs-pino-format";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Params } from "nestjs-pino";
import type { LoggerOptions } from "pino";

/**
 * Structured logging for the API — ECS NDJSON on stdout, nothing else (IKN-1).
 *
 * The contract this implements is the one that makes the monitoring tool disposable: the API
 * never talks to Iknos, never imports a client, never knows it exists. It writes standard lines
 * to stdout, PM2 persists them to `~/.pm2/logs/`, and whatever reads that directory is somebody
 * else's decision. Swapping Iknos for Loki, Elastic or Datadog changes nothing in this file —
 * all three read ECS natively.
 *
 * Destination is stdout only. No file transport and no rotation: that is PM2's job, and an app
 * that also writes its own files gives you two copies of the truth to reconcile.
 */

const SERVICE_NAME = "pfa-api";

/**
 * Probed every 15–30 seconds by whatever is watching. Logging them would bury every line that
 * describes something a person did.
 */
const UNLOGGED_PATHS = new Set(["/api/health", "/api/metrics"]);

/**
 * Read from the working directory, which is where PM2 starts the process and where pnpm runs it.
 *
 * Not an import: `package.json` sits outside `rootDir`, so importing it would either fail the
 * build or change the shape of `dist/`. A missing version is not worth a crash at boot.
 */
function serviceVersion(): string | undefined {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    return (JSON.parse(raw) as { version?: string }).version;
  } catch {
    return undefined;
  }
}

/**
 * ECS puts durations in **nanoseconds**; pino-http reports `responseTime` in milliseconds.
 *
 * Converted here rather than left as-is, because `event.duration` is the field every ECS consumer
 * already knows how to read — leaving `responseTime` would mean the number is present and no tool
 * looks at it. The formatter runs before redaction, which is why the mapping is safe here.
 */
function withEventDuration(options: LoggerOptions): LoggerOptions {
  const format = options.formatters?.log;

  return {
    ...options,
    formatters: {
      ...options.formatters,
      log(object: Record<string, unknown>): Record<string, unknown> {
        const out = format ? format(object) : object;
        if (typeof out.responseTime === "number") {
          out["event.duration"] = Math.round(out.responseTime * 1_000_000);
          delete out.responseTime;
        }
        return out;
      },
    },
  };
}

/**
 * Every path here is the **ECS** shape, not the raw request's.
 *
 * That ordering was verified rather than assumed: pino applies redaction after `formatters.log`,
 * so by the time these run, `req.headers` has already become `http.request.headers`. Written
 * against the raw shape, every one of them would silently match nothing — and the session cookie
 * would be in the logs of an application whose logs are about money.
 */
const REDACTED = [
  "http.request.headers.cookie",
  "http.request.headers.authorization",
  'http.response.headers["set-cookie"]',
  // The pre-conversion shape as well, and not out of superstition: the first working version of
  // this file logged the session cookie in clear because the request never reached the ECS
  // formatter and these paths did not exist. Keeping both means a change in how the request is
  // serialised can never again decide whether a credential is published.
  "req.headers.cookie",
  "req.headers.authorization",
  'res.headers["set-cookie"]',
  // Belt and braces: any line that logs a body or a service argument directly.
  "*.password",
  "*.token",
  "password",
  "token",
  // Spendings carry a label and an amount. Neither belongs in a log line, ever.
  "*.label",
  "*.amount",
];

export function buildLoggerParams(): Params {
  const environment = process.env.NODE_ENV ?? "development";
  const isProduction = environment === "production";
  const isTest = environment === "test";

  return {
    pinoHttp: {
      // Silent in test: a suite that prints a hundred access lines per run teaches everyone to
      // stop reading the output, which is where real failures then hide.
      level: isTest ? "silent" : (process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug")),

      ...withEventDuration(
        ecsFormat({
          serviceName: SERVICE_NAME,
          serviceVersion: serviceVersion(),
          serviceEnvironment: environment,
          // Off by default, and the whole point of this ticket: without it `req` and `res` are
          // logged as raw objects and no consumer finds a method, a path or a status code.
          convertReqRes: true,
        }),
      ),

      /**
       * One id per request, echoed to the caller as `x-request-id`.
       *
       * A middleware copies it onto every line of the request as `trace.id` — see
       * `TraceIdMiddleware`. The ECS name is deliberate: the day an OpenTelemetry SDK is added,
       * the field is already the one it populates, and nothing downstream changes.
       */
      genReqId(req: IncomingMessage, res: ServerResponse): string {
        const id = randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },

      /**
       * Identity serializers, and they are load-bearing rather than decorative.
       *
       * pino-http installs `pino-std-serializers` by default, which flattens `req` into a plain
       * `{ id, method, url, headers }` object. The ECS formatter then duck-types that object for
       * `httpVersion` — which the flattened form no longer has — decides it is not an HTTP
       * request, and silently emits nothing. The result is an access line with a status code and
       * a duration but no method, no path, no client address: found exactly that way, by reading
       * the first line this configuration actually produced.
       *
       * Passing the raw response through lets `formatHttpResponse` do its work, which is where
       * `http.response.status_code` comes from.
       */
      wrapSerializers: false,
      serializers: {
        /**
         * The request is dropped from the line entirely, and this one is not a preference.
         *
         * With `wrapSerializers: false` and no serializer here, pino walks the raw
         * `IncomingMessage` — which means the socket, its parser, `_httpMessage`, and
         * `rawHeaders` containing the session cookie and the Authorization header, several times
         * over through the object graph. Observed, in a log line for a single GET.
         *
         * Everything worth keeping is in `customProps` above, already named as ECS fields.
         */
        req: () => undefined,
        res: (res: ServerResponse) => res,
      },

      /**
       * The request half of the access line, written out by hand.
       *
       * `convertReqRes` handles the response but never sees the request: pino-http binds `req`
       * into a child logger through `pino-std-serializers`, which flattens it into a shape the
       * ECS formatter's duck-typing rejects — no `httpVersion`, therefore not an HTTP request,
       * therefore silence. Several attempts at persuading the serializer layer produced a line
       * with a status code and a duration and no method, no path and no client address.
       *
       * `customProps` is handed the raw objects, so the fields are simply built here. Explicit,
       * ten lines, and it cannot be undone by a change in how anything upstream serialises.
       *
       * Dotted keys rather than nested: ECS consumers read either, and this way the mapping is
       * visible at a glance next to the field names it produces.
       */
      customProps(req: IncomingMessage): Record<string, string | undefined> {
        const request = req as IncomingMessage & { originalUrl?: string; ip?: string; session?: { userId?: string } };
        const url = request.originalUrl ?? request.url ?? "";
        const [path, query] = url.split("?");

        return {
          "http.request.method": request.method,
          "url.path": path,
          "url.query": query,
          // Already resolved through `x-forwarded-for` — main.ts trusts the proxy.
          "client.ip": request.ip ?? request.socket?.remoteAddress,
          "user_agent.original": request.headers["user-agent"],
          // Only the id, when signed in. Never the address, never anything else about the account.
          "user.id": request.session?.userId,
        };
      },

      autoLogging: {
        ignore: (req: IncomingMessage) => UNLOGGED_PATHS.has((req.url ?? "").split("?")[0]),
      },

      redact: { paths: REDACTED, censor: "[redacted]" },

      // Development only. Production writes the JSON that the whole point of this file is to
      // produce; a pretty-printer there would make it unparsable.
      transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true, singleLine: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" },
          },
    },

    // So `PinoLogger.assign` reaches the access line too, and not only the lines emitted by
    // application code during the request.
    assignResponse: true,
  };
}
