import type { SignInAttempt } from "@contexts/identity/domain/interfaces/identityTypes";
import { SignInThrottle } from "@contexts/identity/domain/ports/sign-in-throttle";
import { Injectable } from "@nestjs/common";
import { RedisService } from "@redis/redis.service";

/**
 * Failed sign-ins tolerated per address and per email within the window (PFA-260). nginx's
 * generic `/api/` limit allows thousands of password tries an hour; this caps a sustained guess
 * at a handful, whichever of the two it rotates.
 */
export const MAX_SIGN_IN_FAILURES = 10;
export const SIGN_IN_WINDOW_SECONDS = 15 * 60;

/** Outside `pfa:`, the session store's keyspace, which the metrics count walks. */
const KEY_PREFIX = "pfa-sign-in-failures:";

function counterKeys(attempt: SignInAttempt): string[] {
  return [`${KEY_PREFIX}ip:${attempt.ip ?? "unknown"}`, `${KEY_PREFIX}email:${attempt.email.trim().toLowerCase()}`];
}

/**
 * Counts failed sign-in attempts in Redis, per address and per email, each counter living one
 * window from its first failure. A success clears both.
 */
@Injectable()
export class RedisSignInThrottle extends SignInThrottle {
  constructor(private readonly redis: RedisService) {
    super();
  }

  /** Seconds until the address or the email may try again, or null when neither is locked. */
  async retryAfter(attempt: SignInAttempt): Promise<number | null> {
    const client = this.redis.getClient();
    let wait = 0;
    for (const key of counterKeys(attempt)) {
      const failures = Number((await client.get(key)) ?? 0);
      if (failures >= MAX_SIGN_IN_FAILURES) {
        wait = Math.max(wait, await client.ttl(key));
      }
    }
    return wait > 0 ? wait : null;
  }

  /** A failed sign-in, or any sign-up. */
  async recordAttempt(attempt: SignInAttempt): Promise<void> {
    const client = this.redis.getClient();
    for (const key of counterKeys(attempt)) {
      if ((await client.incr(key)) === 1) {
        await client.expire(key, SIGN_IN_WINDOW_SECONDS);
      }
    }
  }

  async clear(attempt: SignInAttempt): Promise<void> {
    await this.redis.getClient().del(counterKeys(attempt));
  }
}
