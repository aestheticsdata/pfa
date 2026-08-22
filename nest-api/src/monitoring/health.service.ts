import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@redis/redis.service";
import { PrismaService } from "../prisma/prisma.service";
import { readReleaseMarker } from "./release-marker";

export interface DependencyCheck {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded";
  uptime: number;
  version: string | null;
  checks: {
    db: DependencyCheck;
    redis: DependencyCheck;
  };
}

const PROBE_TIMEOUT_MS = 1000;

/**
 * The health check behind `GET /api/health` (IKN-2), replacing the hardcoded `{ status: "ok" }`
 * that answered 200 with MariaDB and Redis dead.
 *
 * One probe per dependency, each with its own latency: the Iknos pills (`mysql 3ms`,
 * `redis 1ms`) need to say which of the two is dragging, so nothing is aggregated. Each probe
 * carries a short timeout — a blocked dependency must not make the probe itself hang past the
 * prober's patience.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(timeoutMs: number = PROBE_TIMEOUT_MS): Promise<HealthReport> {
    const [db, redis] = await Promise.all([
      probe(() => this.prisma.$queryRaw`SELECT 1`, timeoutMs),
      probe(() => this.redis.getClient().ping(), timeoutMs),
    ]);

    return {
      status: db.status === "ok" && redis.status === "ok" ? "ok" : "degraded",
      uptime: Math.round(process.uptime()),
      version: readReleaseMarker()?.version ?? null,
      checks: { db: this.sanitize("db", db), redis: this.sanitize("redis", redis) },
    };
  }

  /**
   * /api/health is public: the body gets a fixed vocabulary ("timed out" / "unavailable"),
   * because raw driver messages name internal hosts, ports and users. The raw message goes to
   * the server log, where that detail is useful and private.
   */
  private sanitize(name: string, check: DependencyCheck): DependencyCheck {
    if (check.status === "ok") {
      return check;
    }
    this.logger.error(`${name} probe failed: ${check.error ?? "unknown error"}`);
    return { ...check, error: check.error === "timed out" ? "timed out" : "unavailable" };
  }
}

async function probe(fn: () => Promise<unknown>, timeoutMs: number): Promise<DependencyCheck> {
  const start = process.hrtime.bigint();
  const elapsedMs = () => Math.round(Number(process.hrtime.bigint() - start) / 1e6);

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
  });

  try {
    await Promise.race([fn(), timeout]);
    return { status: "ok", latencyMs: elapsedMs() };
  } catch (error) {
    return { status: "error", latencyMs: elapsedMs(), error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
