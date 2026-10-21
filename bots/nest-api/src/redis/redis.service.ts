import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { createClient } from "redis";

import type { RateLimitHit } from "#app/redis/interfaces/redisTypes.js";

/** Namespaces every key on the Redis instance ks-b's apps share (`pfa:`, `zeus:`…). */
export const SESSION_PREFIX = "bots:sess:";
const RATE_LIMIT_PREFIX = "bots:rl:";
/** 24 hours, rolling: every request pushes the expiry back. */
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });

  constructor() {
    // Without a listener, the error node-redis emits when the server goes away kills the process.
    this.client.on("error", (error: Error) => this.logger.error(`redis client error: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  /**
   * After the HTTP server has drained (PFA-266): Nest runs `onModuleDestroy` before it closes the
   * server, so a request still in flight at a reload would find this closed under it.
   */
  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }

  getClient(): typeof this.client {
    return this.client;
  }

  /** Every session, after a password reset: one account, so "all sessions" is "this user's". */
  async clearAllSessions(): Promise<void> {
    const keys = await this.client.keys(`${SESSION_PREFIX}*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  /**
   * Counts one attempt against `key`; fixed window, the first attempt sets the TTL. Reports how
   * long until the window ends, for "retry in N min".
   */
  async hitRateLimit(key: string, max: number, windowSeconds: number): Promise<RateLimitHit> {
    const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
    const count = await this.client.incr(redisKey);
    if (count === 1) {
      await this.client.expire(redisKey, windowSeconds);
    }
    const ttl = await this.client.ttl(redisKey);
    return { limited: count > max, count, retryAfterSec: Math.max(0, Number(ttl)) };
  }

  async clearRateLimit(key: string): Promise<void> {
    await this.client.del(`${RATE_LIMIT_PREFIX}${key}`);
  }
}
