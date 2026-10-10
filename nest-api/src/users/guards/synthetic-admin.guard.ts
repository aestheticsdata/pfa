import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, timingSafeEqual } from "crypto";
import type { Request } from "express";

const MIN_TOKEN_LENGTH = 32;
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

/**
 * The bot runner's door into PFA's synthetic accounts (PFA-127): disable or purge one bot. Three
 * locks, every one of them required, and a 404 whichever one fails, so the route does not even
 * admit to existing:
 *
 * - **the socket is loopback** — the caller is a process on ks-b;
 * - **no proxy header** — nginx sets `X-Forwarded-For` / `X-Real-IP` on every `/api/` request it
 *   forwards, so a request carrying neither never went through it: the public internet cannot
 *   reach this route, whatever `trust proxy` says (nginx also denies `/api/internal`);
 * - **the service token** (`SYNTHETIC_ADMIN_TOKEN`, 32+ characters, compared in constant time).
 *   Unset or short = every request refused: the guard fails closed.
 */
@Injectable()
export class SyntheticAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!isAllowed(req, process.env.SYNTHETIC_ADMIN_TOKEN)) {
      throw new NotFoundException();
    }
    return true;
  }
}

export function isAllowed(req: Request, token: string | undefined): boolean {
  if (!token || token.length < MIN_TOKEN_LENGTH) {
    return false;
  }
  if (!LOOPBACK.has(req.socket?.remoteAddress ?? "")) {
    return false;
  }
  if (req.headers["x-forwarded-for"] !== undefined || req.headers["x-real-ip"] !== undefined) {
    return false;
  }
  const header = req.headers.authorization ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  // Hashed first so both sides have the same length: timingSafeEqual leaks nothing, not even that.
  return presented.length > 0 && timingSafeEqual(digest(presented), digest(token));
}
