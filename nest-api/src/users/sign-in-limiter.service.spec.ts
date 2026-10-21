import { MAX_SIGN_IN_FAILURES, SIGN_IN_WINDOW_SECONDS, SignInLimiterService } from "@users/sign-in-limiter.service";
import type { RedisService } from "@redis/redis.service";

/** The sign-in brake (PFA-260): per address and per email, one window from the first failure. */
describe("SignInLimiterService", () => {
  const makeLimiter = () => {
    const counts = new Map<string, number>();
    const ttls = new Map<string, number>();
    const client = {
      get: (key: string) => Promise.resolve(counts.has(key) ? String(counts.get(key)) : null),
      incr: (key: string) => {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return Promise.resolve(counts.get(key));
      },
      expire: (key: string, seconds: number) => {
        ttls.set(key, seconds);
        return Promise.resolve(1);
      },
      ttl: (key: string) => Promise.resolve(ttls.get(key) ?? -2),
      del: (keys: string[]) => {
        keys.forEach((key) => counts.delete(key));
        return Promise.resolve(keys.length);
      },
    };
    const limiter = new SignInLimiterService({ getClient: () => client } as unknown as RedisService);
    return { limiter, ttls };
  };

  it("locks the email once its failures are used up, for what is left of the window", async () => {
    const { limiter, ttls } = makeLimiter();
    for (let attempt = 0; attempt < MAX_SIGN_IN_FAILURES - 1; attempt += 1) {
      await limiter.recordAttempt("1.1.1.1", "Someone@Example.com");
    }
    await expect(limiter.retryAfter("2.2.2.2", "someone@example.com")).resolves.toBeNull();

    await limiter.recordAttempt("1.1.1.1", "someone@example.com");

    expect(ttls.get("pfa-sign-in-failures:email:someone@example.com")).toBe(SIGN_IN_WINDOW_SECONDS);
    await expect(limiter.retryAfter("2.2.2.2", "someone@example.com")).resolves.toBe(SIGN_IN_WINDOW_SECONDS);
  });

  it("locks the address whatever email it rotates", async () => {
    const { limiter } = makeLimiter();
    for (let attempt = 0; attempt < MAX_SIGN_IN_FAILURES; attempt += 1) {
      await limiter.recordAttempt("1.1.1.1", `guess-${attempt}@example.com`);
    }

    await expect(limiter.retryAfter("1.1.1.1", "fresh@example.com")).resolves.toBe(SIGN_IN_WINDOW_SECONDS);
  });

  it("forgets both counters on a successful sign-in", async () => {
    const { limiter } = makeLimiter();
    for (let attempt = 0; attempt < MAX_SIGN_IN_FAILURES; attempt += 1) {
      await limiter.recordAttempt("1.1.1.1", "someone@example.com");
    }

    await limiter.clear("1.1.1.1", "someone@example.com");

    await expect(limiter.retryAfter("1.1.1.1", "someone@example.com")).resolves.toBeNull();
  });
});
