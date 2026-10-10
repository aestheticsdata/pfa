import { createHash, timingSafeEqual } from "node:crypto";

/**
 * `Authorization: Bearer <token>` against the configured service token. Both sides are hashed
 * first so the comparison is constant-time whatever their lengths: the response time says nothing
 * about how much of a guess was right.
 */
export function isAuthorized(header: string | undefined, token: string): boolean {
  if (!header?.startsWith("Bearer ") || token === "") {
    return false;
  }
  const given = createHash("sha256").update(header.slice("Bearer ".length)).digest();
  const expected = createHash("sha256").update(token).digest();
  return timingSafeEqual(given, expected);
}
