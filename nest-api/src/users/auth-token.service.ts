import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { RedisService } from "@redis/redis.service";

/**
 * Outside `pfa:` on purpose, like the user-sessions index: that prefix is the cookie-session
 * store's keyspace, which the `active_sessions` metric walks and expects to hold sessions only.
 */
const TOKEN_PREFIX = "pfa-token:";

/** How long an unused token stays valid. Every authenticated request pushes it back. */
export const AUTH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

/** 32 random bytes: as much entropy as the session ID, URL-safe so it fits a header as-is. */
const TOKEN_BYTES = 32;

/** Redis holds a hash of the token, never the token: a dump of the store signs nobody in. */
const keyOf = (token: string) => `${TOKEN_PREFIX}${createHash("sha256").update(token).digest("hex")}`;

/**
 * The mobile app's credential (PFA-286): an opaque Bearer token mapped to a user ID in Redis.
 * It sits beside the web's cookie session, never instead of it — the same guard accepts either.
 */
@Injectable()
export class AuthTokenService {
  constructor(private readonly redis: RedisService) {}

  async issue(userId: string): Promise<string> {
    const token = randomBytes(TOKEN_BYTES).toString("base64url");
    await this.redis.getClient().set(keyOf(token), userId, { EX: AUTH_TOKEN_TTL_SECONDS });
    return token;
  }

  /** The user the token belongs to, or null when it is unknown, expired or revoked. Slides its expiry. */
  async resolve(token: string): Promise<string | null> {
    const key = keyOf(token);
    const userId = await this.redis.getClient().get(key);
    if (userId === null) return null;
    await this.redis.getClient().expire(key, AUTH_TOKEN_TTL_SECONDS);
    return userId;
  }

  async revoke(token: string): Promise<void> {
    await this.redis.getClient().del(keyOf(token));
  }
}
