import { env } from "@config/env";
import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";
import { capturePool, type DbPoolStats, type MariaDbPoolLike, poolStats } from "./db-pool-stats";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private pool: MariaDbPoolLike | null = null;

  constructor() {
    const url = env.databaseUrl;
    if (!url) {
      throw new Error("DATABASE_URL is required");
    }

    const parsed = new URL(url);
    const adapter = new PrismaMariaDb({
      host: parsed.hostname,
      port: parseInt(parsed.port || "3306", 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });

    // The adapter's pool only exists once Prisma calls `connect()` — lazily, at `$connect()` in
    // onModuleInit — so patching the factory here is early enough (IKN-2).
    capturePool(adapter, (pool) => {
      this.pool = pool;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * After the HTTP server has drained (PFA-265): Nest runs `onModuleDestroy` before it closes the
   * server, so a request still in flight at a deploy would find this closed under it.
   */
  async onApplicationShutdown() {
    await this.$disconnect();
  }

  /** `null` until the adapter has connected — the metrics gauge then omits the series. */
  getPoolStats(): DbPoolStats | null {
    return this.pool ? poolStats(this.pool) : null;
  }
}
