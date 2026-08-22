import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

const SESSION_PREFIX = "pfa:";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });
    // Without a listener, the socket error emitted when Redis goes away is an unhandled 'error'
    // event and kills the process — a Redis outage must end up as a 503 on /api/health, not as a
    // crash (IKN-2). node-redis reconnects on its own once the server is back.
    this.client.on("error", (error: Error) => {
      this.logger.error(`redis client error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Removes all sessions for a given user in Redis.
   * Ensures only one active session per user (called before creating new session on login).
   */
  async clearSessionsForUser(userId: string): Promise<void> {
    const keys = await this.client.keys(`${SESSION_PREFIX}*`);
    for (const key of keys) {
      try {
        const value = await this.client.get(key);
        if (value) {
          const session = JSON.parse(value) as { userId?: string };
          if (session.userId === userId) {
            await this.client.del(key);
          }
        }
      } catch {
        // Skip malformed entries
      }
    }
  }
}
