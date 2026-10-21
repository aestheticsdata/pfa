import { AppConfig } from "@config/app.config";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@redis/redis.service";
import { isSyntheticEmail, SYNTHETIC_ACCOUNTS_WHERE } from "@users/synthetic-email.util";
import type { PurgeCounts, SyntheticAccountRef } from "@users/synthetic-purge.util";
import { purgeSyntheticAccounts } from "@users/synthetic-purge.util";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Disable or purge **one** bot account, on the bot back-office's request (PFA-127). Every lookup
 * goes through the synthetic filter (flag AND reserved domain), so an email that is not a bot's —
 * a typo, or a real person's — is "not found", never touched.
 */
@Injectable()
export class SyntheticAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /** Sign-in refused from now on, live sessions revoked, data kept. Idempotent. */
  async disable(email: string): Promise<{ email: string; disabledAt: Date }> {
    const account = await this.find(email);
    const disabledAt = new Date();
    await this.prisma.users.update({ where: { ID: account.ID }, data: { disabledAt } });
    await this.redis.clearSessionsForUser(account.ID);
    return { email: account.email, disabledAt };
  }

  /** The account and everything it owns, irreversibly. Sessions go too. */
  async purge(email: string): Promise<{ email: string; deleted: PurgeCounts }> {
    const account = await this.find(email);
    await this.redis.clearSessionsForUser(account.ID);
    const deleted = await purgeSyntheticAccounts(
      this.prisma,
      [account],
      this.configService.getOrThrow<AppConfig>("app").invoicesPath,
    );
    return { email: account.email, deleted };
  }

  private async find(email: string): Promise<SyntheticAccountRef> {
    if (!isSyntheticEmail(email)) {
      throw new NotFoundException("Unknown synthetic account");
    }
    const account = await this.prisma.users.findFirst({
      where: { ...SYNTHETIC_ACCOUNTS_WHERE, email: email.trim().toLowerCase() },
      select: { ID: true, email: true },
    });
    if (!account) {
      throw new NotFoundException("Unknown synthetic account");
    }
    return account;
  }
}
