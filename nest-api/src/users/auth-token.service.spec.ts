import type { RedisService } from "@redis/redis.service";
import { AUTH_TOKEN_TTL_SECONDS, AuthTokenService } from "@users/auth-token.service";

/** A Redis double holding keys in a Map, with the TTL each one was last given. */
const memoryRedis = () => {
  const values = new Map<string, string>();
  const ttls = new Map<string, number>();
  const client = {
    set: jest.fn((key: string, value: string, options: { EX: number }) => {
      values.set(key, value);
      ttls.set(key, options.EX);
      return Promise.resolve("OK");
    }),
    get: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
    expire: jest.fn((key: string, seconds: number) => {
      ttls.set(key, seconds);
      return Promise.resolve(1);
    }),
    del: jest.fn((key: string) => Promise.resolve(values.delete(key) ? 1 : 0)),
  };
  return { redis: { getClient: () => client } as unknown as RedisService, values, ttls, client };
};

describe("AuthTokenService", () => {
  it("issues a token that resolves to its user", async () => {
    const { redis } = memoryRedis();
    const tokens = new AuthTokenService(redis);

    const token = await tokens.issue("user-1");

    expect(token).toMatch(/^[\w-]{43}$/);
    await expect(tokens.resolve(token)).resolves.toBe("user-1");
  });

  it("stores a hash of the token, never the token itself", async () => {
    const { redis, values } = memoryRedis();
    const token = await new AuthTokenService(redis).issue("user-1");

    const [key] = [...values.keys()];
    expect(key).toMatch(/^pfa-token:[0-9a-f]{64}$/);
    expect(key).not.toContain(token);
  });

  it("keeps the token out of the session keyspace the metrics walk", async () => {
    const { redis, values } = memoryRedis();
    await new AuthTokenService(redis).issue("user-1");

    expect([...values.keys()].every((key) => !key.startsWith("pfa:"))).toBe(true);
  });

  it("slides the expiry each time the token is used", async () => {
    const { redis, client } = memoryRedis();
    const tokens = new AuthTokenService(redis);
    const token = await tokens.issue("user-1");

    await tokens.resolve(token);

    expect(client.expire).toHaveBeenCalledWith(expect.stringMatching(/^pfa-token:/), AUTH_TOKEN_TTL_SECONDS);
  });

  it("forgets a revoked token, and an unknown one resolves to nobody", async () => {
    const { redis } = memoryRedis();
    const tokens = new AuthTokenService(redis);
    const token = await tokens.issue("user-1");

    await tokens.revoke(token);

    await expect(tokens.resolve(token)).resolves.toBeNull();
    await expect(tokens.resolve("never-issued")).resolves.toBeNull();
  });
});
