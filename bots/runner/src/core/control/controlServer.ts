import { createServer } from "node:http";
import { LOAD_PACE } from "@core/constants/bot";
import { HTTP_METHOD } from "@core/constants/http";
import { isAuthorized } from "@core/control/controlAuth";
import { logger } from "@core/log/logger";
import { isValidQuietHours } from "@core/time/quietHours";

import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { LoadPace } from "@core/interfaces/botTypes";
import type { ControlServerOptions } from "@core/interfaces/controlTypes";

const MAX_BODY_BYTES = 64 * 1024;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** One request, decoded once: what the routes below match on. */
interface Route {
  req: IncomingMessage;
  method: string;
  /** Path segments, decoded: `/bots/saturnus/restart-session` → `["bots", "saturnus", "restart-session"]`. */
  parts: string[];
}

/**
 * The runner's control API — for the back-office (PFA-127) and for curl over SSH. Loopback only and
 * token-gated: it is never routed by the public nginx.
 */
export function createControlServer<TPersona>(options: ControlServerOptions<TPersona>): Server {
  return createServer((req, res) => {
    handle(req, options)
      .then((body) => send(res, 200, body))
      .catch((error: unknown) => {
        const status = error instanceof HttpError ? error.status : 500;
        if (status === 500) {
          logger.error("control API error", { path: req.url, error: String(error) });
        }
        send(res, status, { error: error instanceof HttpError ? error.message : "Internal error" });
      });
  });
}

async function handle<TPersona>(req: IncomingMessage, options: ControlServerOptions<TPersona>): Promise<unknown> {
  // Zeus's liveness probe: no token, nothing logged, nothing about the runner in the answer.
  if (req.method === HTTP_METHOD.get && req.url === "/health") {
    return { status: "ok" };
  }
  if (!isAuthorized(req.headers.authorization, options.token)) {
    logger.warn("control API: unauthorized request", { path: req.url, ip: req.socket.remoteAddress });
    throw new HttpError(401, "Unauthorized");
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const route: Route = {
    req,
    method: req.method ?? HTTP_METHOD.get,
    parts: url.pathname.split("/").filter(Boolean).map(decodeURIComponent),
  };
  const answer = (await runnerRoutes(route, options)) ?? (await botRoutes(route, options));
  if (answer === undefined) {
    throw new HttpError(404, "Not found");
  }
  return answer;
}

/** Runner-wide reads and settings. `undefined` = not one of these routes. */
async function runnerRoutes<TPersona>(route: Route, { runner }: ControlServerOptions<TPersona>): Promise<unknown> {
  const { req, method, parts } = route;
  const [resource, sub] = parts;
  const key = `${method} ${resource ?? ""}${parts.length > 1 ? "/*" : ""}`;

  switch (key) {
    case `${HTTP_METHOD.get} status`:
      return runner.status();
    case `${HTTP_METHOD.get} history`:
      return runner.history();
    case `${HTTP_METHOD.get} history/*`:
      if (sub === "day") {
        return runner.dayHistory();
      }
      return undefined;
    case `${HTTP_METHOD.get} limits`:
      return runner.status().limits;
    case `${HTTP_METHOD.get} upload-budget`:
      return runner.status().uploadBudget;
    case `${HTTP_METHOD.get} actions`:
      return runner.snapshotActions();
    case `${HTTP_METHOD.get} quiet-hours`:
      return runner.quietHours();
    case `${HTTP_METHOD.put} quiet-hours`: {
      const body = await readBody(req);
      if (!isValidQuietHours(body)) {
        throw new HttpError(400, '"from" and "to" must be distinct 24 h "HH:MM" times');
      }
      return runner.setQuietHours(body);
    }
    case `${HTTP_METHOD.put} daily`:
      return { enabled: await runner.setDailyEnabled(readBoolean(await readBody(req), "enabled")) };
    case `${HTTP_METHOD.put} target`:
      return { target: await runner.setTarget(readNumber(await readBody(req), "target")) };
    case `${HTTP_METHOD.put} load`:
      return { enabled: await runner.setLoadEnabled(readBoolean(await readBody(req), "enabled")) };
    case `${HTTP_METHOD.put} load-pace`:
      return { pace: await runner.setLoadPace(readPace(await readBody(req))) };
    case `${HTTP_METHOD.put} ramp`: {
      const body = await readBody(req);
      return runner.setRamp({ step: readNumber(body, "step"), everySec: readNumber(body, "everySec") });
    }
    case `${HTTP_METHOD.post} actions/*`:
      if (sub === "enable-all") {
        await runner.enableAllActions();
        return runner.snapshotActions();
      }
      return undefined;
    case `${HTTP_METHOD.patch} actions/*`: {
      const enabled = readBoolean(await readBody(req), "enabled");
      if (!sub || !(await runner.setActionEnabled(sub, enabled))) {
        throw new HttpError(404, "Unknown action");
      }
      return { action: sub, enabled };
    }
  }
  return undefined;
}

/** Bots and their accounts. `undefined` = not one of these routes. */
async function botRoutes<TPersona>(route: Route, { runner }: ControlServerOptions<TPersona>): Promise<unknown> {
  const { req, method, parts } = route;
  const [resource, id, verb] = parts;

  if (resource === "bots") {
    if (method === HTTP_METHOD.get && !id) {
      return runner.snapshotBots();
    }
    if (method === HTTP_METHOD.post && id === "bulk") {
      const body = await readBody(req);
      return runner.setBotsEnabled({ ids: readIds(body), enabled: readBoolean(body, "enabled") });
    }
    if (!id) {
      return undefined;
    }
    if (method === HTTP_METHOD.get && !verb) {
      return runner.detail(id) ?? notFound("bot");
    }
    if (method === HTTP_METHOD.patch && !verb) {
      const enabled = readBoolean(await readBody(req), "enabled");
      return (await runner.setBotEnabled(id, enabled)) ? { bot: id, enabled } : notFound("bot");
    }
    if (method === HTTP_METHOD.post && verb === "restart-session") {
      return runner.restartSession(id) ? { bot: id, restarted: true } : notFound("bot");
    }
  }

  if (resource === "accounts" && id) {
    const purge = method === HTTP_METHOD.delete && !verb;
    const disable = method === HTTP_METHOD.post && verb === "disable";
    if (!purge && !disable) {
      return undefined;
    }
    try {
      return (await runner.closeAccount(id, purge))
        ? { bot: id, result: purge ? "purged" : "disabled" }
        : notFound("bot");
    } catch (error) {
      if (error instanceof HttpError) throw error;
      // The app refused or could not be reached: say so, the operator can retry.
      throw new HttpError(502, `The app did not ${purge ? "purge" : "disable"} the account: ${String(error)}`);
    }
  }
  return undefined;
}

function notFound(what: string): never {
  throw new HttpError(404, `Unknown ${what}`);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, "Body too large");
    }
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

function readBoolean(body: unknown, field: string): boolean {
  const value = (body as Record<string, unknown> | null)?.[field];
  if (typeof value !== "boolean") {
    throw new HttpError(400, `"${field}" must be a boolean`);
  }
  return value;
}

function readNumber(body: unknown, field: string): number {
  const value = (body as Record<string, unknown> | null)?.[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new HttpError(400, `"${field}" must be a non-negative number`);
  }
  return value;
}

function readPace(body: unknown): LoadPace {
  const value = (body as Record<string, unknown> | null)?.pace;
  if (!Object.values<unknown>(LOAD_PACE).includes(value)) {
    throw new HttpError(400, `"pace" must be one of ${Object.values(LOAD_PACE).join(", ")}`);
  }
  return value as LoadPace;
}

function readIds(body: unknown): string[] {
  const value = (body as Record<string, unknown> | null)?.ids;
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string") || value.length > 1000) {
    throw new HttpError(400, '"ids" must be an array of bot ids');
  }
  return value as string[];
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
