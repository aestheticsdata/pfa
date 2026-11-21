import { AppConfig } from "@config/app.config";
import type { PurgeCounts, SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountPurger } from "@contexts/identity/domain/ports/account-purger";
import { PasswordHasher } from "@contexts/identity/domain/ports/password-hasher";
import { SessionRevoker } from "@contexts/identity/domain/ports/session-revoker";
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
export class RedisSessionRevoker extends SessionRevoker {
  constructor(private readonly redis: RedisService) {
    super();
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
