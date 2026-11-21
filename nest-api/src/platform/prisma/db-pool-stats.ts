/**
 * Read the mariadb connection pool out of `@prisma/adapter-mariadb` for `db_pool_connections`
 * (IKN-2).
 *
 * The adapter factory creates its pool inside `connect()` and keeps it in `#private` state;
 * the driver it resolves to is the only thing that exposes it, via `underlyingDriver()`. Prisma
 * calls `connect()` lazily at `$connect()`, so the factory can be patched after construction and
 * the pool still comes through the first (and only) real connect.
 */

/** The three counters the mariadb `Pool` exposes and the gauge needs — nothing more. */
export interface MariaDbPoolLike {
  activeConnections(): number;
  idleConnections(): number;
  taskQueueSize(): number;
}

export interface DbPoolStats {
  active: number;
  idle: number;
  waiting: number;
}

interface ConnectableFactory {
  connect(): Promise<unknown>;
}

export function capturePool(factory: ConnectableFactory, onPool: (pool: MariaDbPoolLike) => void): void {
  const originalConnect: () => Promise<unknown> = factory.connect.bind(factory);
  factory.connect = async () => {
    const driver = await originalConnect();
    const underlying = (driver as { underlyingDriver?: () => MariaDbPoolLike }).underlyingDriver?.();
    if (underlying) {
      onPool(underlying);
    }
    return driver;
  };
}

export function poolStats(pool: MariaDbPoolLike): DbPoolStats {
  return {
    active: pool.activeConnections(),
    idle: pool.idleConnections(),
    waiting: pool.taskQueueSize(),
  };
}
