import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

const SESSION_PREFIX = "pfa:";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });
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
