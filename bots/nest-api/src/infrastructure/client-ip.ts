import type { Request } from "express";
import type { RequestConnection } from "#app/infrastructure/interfaces/connectionTypes.js";

/**
 * The one place that decides which address a request came from (copied from Zeus).
 *
 * Two implementations of "which address is this" is one more than can be kept in agreement, and
 * before this file there were two: the route logger in `main.ts` split `X-Forwarded-For` by hand
 * while everything else would have reached for `req.ip`. They agree today and would not have kept
 * agreeing — the audit log and the log line beside it disagreeing about a client address is exactly
 * the discrepancy nobody would think to check.
 *
 * `req.ip` is the answer in production. The back-office API is only ever called by its own Next
 * server on 127.0.0.1, which forwards the `X-Forwarded-For` nginx built; `main.ts` sets
 * `trust proxy 1`, so Express takes the rightmost hop — the address nginx saw. The header reads below are the fallback for a request that reached the
 * app some other way — the loopback calls Zeus's own prune jobs make, or a dev machine with no proxy in
 * front of it — and the socket address is the floor beneath both.
 *
 * ⚠️ **Never trust `X-Forwarded-For` ahead of `req.ip`.** The header is client-settable, and
 * preferring it would let anyone put any address in the audit log by sending one.
 */
export const clientIp = (req: Request): string | null => {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedFirst = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  const realIp = req.headers["x-real-ip"];

  const candidate =
    req.ip || (Array.isArray(realIp) ? realIp[0] : realIp) || forwardedFirst || req.socket?.remoteAddress;

  return normaliseIp(candidate);
};

/**
 * `::ffff:82.66.1.5` and `82.66.1.5` are the same address, and must not become two rows.
 *
 * Node reports the mapped form whenever the listening socket is dual-stack, which is most of the
 * time locally — so without this the same laptop appears under two spellings, the `@@index([ip])`
 * lookup for "what did this address resolve to last time" misses half its own history, and
 * `isPublicAddress` has to know about the prefix as well.
 *
 * The `AuditEntry.ip` column is 45 characters either way: that is the longest IPv6 text form, which
 * is the mapped one this strips. Storing the shorter form does not make the column narrower — it
 * makes the value unambiguous.
 */
const normaliseIp = (value: string | undefined | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const unmapped = trimmed.startsWith("::ffff:") ? trimmed.slice("::ffff:".length) : trimmed;

  // The column's width, and the only bound worth applying: an address longer than the longest legal
  // one is not an address, and truncating it would invent a different one.
  return unmapped.length > 0 && unmapped.length <= 45 ? unmapped : null;
};

/** The user agent, trimmed to the column. Absent is a real state — plenty of clients send none. */
export const clientUserAgent = (req: Request): string | null => {
  const raw = req.headers["user-agent"];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value ? value.slice(0, 255) : null;
};

export const requestConnection = (req: Request): RequestConnection => ({
  ip: clientIp(req),
  userAgent: clientUserAgent(req),
});
