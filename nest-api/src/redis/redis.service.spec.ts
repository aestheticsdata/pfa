import { RedisService } from "./redis.service";

/**
 * A Redis outage must be a condition the API reports, not one it dies of (IKN-2): without an
 * `error` listener on the client, the socket error node-redis emits when the server goes away
 * is an unhandled 'error' event — and that kills the process before /api/health can ever
 * answer 503.
 */
describe("RedisService", () => {
  it("survives an error event on the client instead of crashing the process", () => {
    const service = new RedisService();

    expect(() => {
      service.getClient().emit("error", new Error("connection lost"));
    }).not.toThrow();
  });
});

/** The `active_sessions` gauge (PFA-212) is only as right as this count. */
describe("RedisService.countActiveSessions", () => {
  const withStore = (batches: string[][], values: Record<string, string | null>): RedisService => {
    const service = new RedisService();
    const client = service.getClient();
    Object.assign(client, {
      scanIterator: () =>
        (async function* () {
          yield* await Promise.resolve(batches);
        })(),
      mGet: (keys: string[]) => Promise.resolve(keys.map((key) => values[key] ?? null)),
    });
    return service;
  };

  it("counts signed-in sessions, people and bots apart", async () => {
    const service = withStore([["pfa:a", "pfa:b"], [], ["pfa:c"]], {
      "pfa:a": JSON.stringify({ userId: "u1" }),
      "pfa:b": JSON.stringify({ userId: "u2", isSynthetic: true }),
      "pfa:c": JSON.stringify({ userId: "u3", isSynthetic: false }),
    });

    await expect(service.countActiveSessions()).resolves.toEqual({ real: 2, synthetic: 1 });
  });

  it("skips sessions with nobody behind them, expired keys and malformed values", async () => {
    const service = withStore([["pfa:a", "pfa:b", "pfa:c"]], {
      "pfa:a": JSON.stringify({ cookie: {} }),
      "pfa:c": "{not json",
    });

    await expect(service.countActiveSessions()).resolves.toEqual({ real: 0, synthetic: 0 });
  });
});
