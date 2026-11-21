import { AppConfig } from "@config/app.config";
import type { PurgeCounts, SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountPurger } from "@contexts/identity/domain/ports/account-purger";
import { PasswordHasher } from "@contexts/identity/domain/ports/password-hasher";
import { SessionRegistry } from "@contexts/identity/domain/ports/session-registry";
import { purgeSyntheticAccounts } from "@contexts/identity/infrastructure/synthetic-purge";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@redis/redis.service";
import * as bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  matches(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

@Injectable()
export class RedisSessionRegistry extends SessionRegistry {
  constructor(private readonly redis: RedisService) {
    super();
  }

  track(accountId: string, sessionId: string): Promise<void> {
    return this.redis.trackSession(accountId, sessionId);
  }

  untrack(accountId: string, sessionId: string): Promise<void> {
    return this.redis.untrackSession(accountId, sessionId);
  }

  async revokeAll(accountId: string): Promise<void> {
    await this.redis.clearSessionsForUser(accountId);
  }
}

/** The purge `synthetic:purge` also runs, so the two never disagree on "everything they own". */
@Injectable()
export class PrismaAccountPurger extends AccountPurger {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  purge(accounts: SyntheticAccountRef[]): Promise<PurgeCounts> {
    return purgeSyntheticAccounts(this.prisma, accounts, this.config.getOrThrow<AppConfig>("app").invoicesPath);
  }
}
