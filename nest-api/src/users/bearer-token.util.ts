import type { Request } from "express";

const BEARER = /^Bearer\s+(\S+)$/i;

/** The token of an `Authorization: Bearer <token>` header, or null when there is none. */
export function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string") return null;
  return BEARER.exec(header.trim())?.[1] ?? null;
}
