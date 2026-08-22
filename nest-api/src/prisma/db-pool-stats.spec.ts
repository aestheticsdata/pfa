import { capturePool, poolStats, type MariaDbPoolLike } from "./db-pool-stats";

/**
 * `db_pool_connections` (IKN-2) needs the mariadb pool that `@prisma/adapter-mariadb` creates
 * inside `connect()` and never exposes on the Prisma client. The only seam is the factory's
 * `connect()` itself: it is called lazily at `$connect()`, so patching it after construction
 * still catches the pool.
 */
describe("capturePool", () => {
  const makePool = (): MariaDbPoolLike => ({
    activeConnections: () => 3,
    idleConnections: () => 7,
    taskQueueSize: () => 0,
  });

  it("hands the underlying pool to the callback when the adapter connects", async () => {
    const pool = makePool();
    const driver = { underlyingDriver: () => pool };
    const factory = { connect: () => Promise.resolve<unknown>(driver) };
    let captured: MariaDbPoolLike | null = null;

    capturePool(factory, (p) => {
      captured = p;
    });
    const returned = await factory.connect();

    expect(captured).toBe(pool);
    expect(returned).toBe(driver);
  });

  it("leaves the callback uncalled when the driver has no underlyingDriver", async () => {
    const factory = { connect: () => Promise.resolve<unknown>({}) };
    let called = false;

    capturePool(factory, () => {
      called = true;
    });
    await factory.connect();

    expect(called).toBe(false);
  });

  it("propagates connect() failures untouched", async () => {
    const factory = {
      connect: () => Promise.reject<unknown>(new Error("db is down")),
    };

    capturePool(factory, () => undefined);

    await expect(factory.connect()).rejects.toThrow("db is down");
  });
});

describe("poolStats", () => {
  it("maps the mariadb pool counters onto active, idle and waiting", () => {
    const pool: MariaDbPoolLike = {
      activeConnections: () => 10,
      idleConnections: () => 0,
      taskQueueSize: () => 4,
    };

    expect(poolStats(pool)).toEqual({ active: 10, idle: 0, waiting: 4 });
  });
});
