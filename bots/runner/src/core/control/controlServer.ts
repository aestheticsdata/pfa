import { createServer } from "node:http";
import { HTTP_METHOD } from "@core/constants/http";
import { isAuthorized } from "@core/control/controlAuth";
import { logger } from "@core/log/logger";

import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { ControlServerOptions } from "@core/interfaces/controlTypes";

const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The runner's control API (start/stop, toggles, status) — for the back-office (PFA-127) and for
 * curl over SSH. Loopback only and token-gated: it is never routed by the public nginx.
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
  if (!isAuthorized(req.headers.authorization, options.token)) {
    logger.warn("control API: unauthorized request", { path: req.url, ip: req.socket.remoteAddress });
    throw new HttpError(401, "Unauthorized");
  }
  const { runner } = options;
  const url = new URL(req.url ?? "/", "http://localhost");
  const route = `${req.method} ${url.pathname}`;
  const [, resource, id] = url.pathname.split("/");

  switch (route) {
    case `${HTTP_METHOD.get} /status`:
      return runner.status();
    case `${HTTP_METHOD.get} /bots`:
      return runner.snapshotBots();
    case `${HTTP_METHOD.get} /actions`:
      return runner.snapshotActions();
    case `${HTTP_METHOD.get} /limits`:
      return runner.status().limits;
    case `${HTTP_METHOD.get} /upload-budget`:
      return runner.status().uploadBudget;
    case `${HTTP_METHOD.post} /runner`: {
      const running = readBoolean(await readBody(req), "running");
      await (running ? runner.start() : runner.stop());
      return runner.status();
    }
  }

  if (req.method === HTTP_METHOD.patch && id && (resource === "bots" || resource === "actions")) {
    const enabled = readBoolean(await readBody(req), "enabled");
    const name = decodeURIComponent(id);
    const found =
      resource === "bots" ? await runner.setBotEnabled(name, enabled) : await runner.setActionEnabled(name, enabled);
    if (!found) {
      throw new HttpError(404, `Unknown ${resource === "bots" ? "bot" : "action"}`);
    }
    return { [resource === "bots" ? "bot" : "action"]: name, enabled };
  }
  throw new HttpError(404, "Not found");
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

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
