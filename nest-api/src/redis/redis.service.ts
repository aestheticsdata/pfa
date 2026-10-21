import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

import type { SessionCounts } from "@redis/interfaces/redisTypes";
import { env } from "@config/env";

const SESSION_PREFIX = "pfa:";
/**
 * Outside `pfa:` on purpose: that prefix is the session store's keyspace, which the metrics
 * count walks and expects to hold sessions only.
 */
const USER_SESSIONS_PREFIX = "pfa-user-sessions:";

function userSessionsKey(userId: string): string {
  return `${USER_SESSIONS_PREFIX}${userId}`;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor() {
    const redisUrl = env.redisUrl;
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
   * Indexes a freshly signed-in session under its user (PFA-256): a user keeps one session per
   * device, and this set is what lets them all be revoked at once without walking the keyspace.
   * Entries whose session has since expired are dropped first, so the set stays as small as the
   * user's live devices.
   */
  async trackSession(userId: string, sessionId: string): Promise<void> {
    const key = userSessionsKey(userId);
    const tracked = await this.client.sMembers(key);
    if (tracked.length > 0) {
      const alive = await Promise.all(tracked.map((id) => this.client.exists(`${SESSION_PREFIX}${id}`)));
      const expired = tracked.filter((_, index) => alive[index] === 0);
      if (expired.length > 0) {
        await this.client.sRem(key, expired);
      }
    }
    await this.client.sAdd(key, sessionId);
  }

  /** Drops one session from its user's index, on logout. */
  async untrackSession(userId: string, sessionId: string): Promise<void> {
    await this.client.sRem(userSessionsKey(userId), sessionId);
  }

  /**
   * Revokes every session of a user — all devices — through the per-user index (PFA-256).
   * Used when a bot account is disabled or purged; nothing calls it on sign-in any more.
   */
  async clearSessionsForUser(userId: string): Promise<void> {
    const key = userSessionsKey(userId);
    const tracked = await this.client.sMembers(key);
    await this.client.del([...tracked.map((id) => `${SESSION_PREFIX}${id}`), key]);
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
