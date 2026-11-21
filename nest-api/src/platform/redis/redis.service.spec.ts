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

/** The per-user session index (PFA-256): one session per device, all revocable at once. */
describe("RedisService session index", () => {
  const withSets = (
    sets: Record<string, string[]>,
    liveKeys: string[],
  ): { service: RedisService; deleted: string[] } => {
    const service = new RedisService();
    const deleted: string[] = [];
    Object.assign(service.getClient(), {
      sMembers: (key: string) => Promise.resolve([...(sets[key] ?? [])]),
      sAdd: (key: string, member: string) => {
        sets[key] = [...(sets[key] ?? []), member];
        return Promise.resolve(1);
      },
      sRem: (key: string, members: string | string[]) => {
        const gone = [members].flat();
        sets[key] = (sets[key] ?? []).filter((id) => !gone.includes(id));
        return Promise.resolve(gone.length);
      },
      exists: (key: string) => Promise.resolve(liveKeys.includes(key) ? 1 : 0),
      del: (keys: string[]) => {
        deleted.push(...keys);
        return Promise.resolve(keys.length);
      },
    });
    return { service, deleted };
  };

  it("adds the new session and drops the user's expired ones, keeping the live devices", async () => {
    const sets = { "pfa-user-sessions:u1": ["laptop", "stale"] };
    const { service } = withSets(sets, ["pfa:laptop"]);

    await service.trackSession("u1", "phone");

    expect(sets["pfa-user-sessions:u1"]).toEqual(["laptop", "phone"]);
  });

  it("untracks only the session that logs out", async () => {
    const sets = { "pfa-user-sessions:u1": ["laptop", "phone"] };
    const { service } = withSets(sets, []);

    await service.untrackSession("u1", "phone");

    expect(sets["pfa-user-sessions:u1"]).toEqual(["laptop"]);
  });

  it("revokes every session of the user and the index itself", async () => {
    const { service, deleted } = withSets({ "pfa-user-sessions:u1": ["laptop", "phone"] }, []);

    await service.clearSessionsForUser("u1");

    expect(deleted).toEqual(["pfa:laptop", "pfa:phone", "pfa-user-sessions:u1"]);
  });
});
