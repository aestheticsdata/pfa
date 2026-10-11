import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

import type { SessionCounts } from "@redis/interfaces/redisTypes";

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

  /**
   * Signed-in sessions, people and bots apart (PFA-212). SCAN rather than KEYS: this runs on every
   * metrics scrape, and KEYS blocks the server for as long as it walks the keyspace.
   *
   * A session without a `userId` is not counted: nobody is behind it.
   */
  async countActiveSessions(): Promise<SessionCounts> {
    const counts: SessionCounts = { real: 0, synthetic: 0 };

    for await (const keys of this.client.scanIterator({ MATCH: `${SESSION_PREFIX}*`, COUNT: 200 })) {
      if (keys.length === 0) {
        continue;
      }
      for (const value of await this.client.mGet(keys)) {
        const session = parseSession(value);
        if (!session?.userId) {
          continue;
        }
        if (session.isSynthetic) {
          counts.synthetic += 1;
        } else {
          counts.real += 1;
        }
      }
    }

    return counts;
  }
}

/** The two fields of a stored session the counts read; `isSynthetic` is set at sign-in. */
interface StoredSession {
  userId?: string;
  isSynthetic?: boolean;
}

/** A session expired between SCAN and MGET comes back null; a malformed one is skipped. */
function parseSession(value: string | null): StoredSession | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as StoredSession;
  } catch {
    return null;
  }
}
