import { UnknownSyntheticAccount } from "@contexts/identity/domain/identity-errors";
import type { PurgeCounts, SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";
import { AccountPurger } from "@contexts/identity/domain/ports/account-purger";
import { SessionRegistry } from "@contexts/identity/domain/ports/session-registry";
import { isSyntheticEmail } from "@contexts/identity/domain/synthetic-email";
import { Injectable } from "@nestjs/common";

/**
 * Disable or purge **one** bot account, on the bot back-office's request (PFA-127). Every lookup
 * goes through the synthetic filter (flag AND reserved domain), so an email that is not a bot's —
 * a typo, or a real person's — is "not found", never touched.
 */
@Injectable()
export class SyntheticAccountsService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly sessions: SessionRegistry,
    private readonly purger: AccountPurger,
  ) {}

  /** Sign-in refused from now on, live sessions revoked, data kept. Idempotent. */
  async disable(email: string): Promise<{ email: string; disabledAt: Date }> {
    const account = await this.find(email);
    const disabledAt = new Date();
    await this.accounts.disable(account.ID, disabledAt);
    await this.sessions.revokeAll(account.ID);
    return { email: account.email, disabledAt };
  }

  /** The account and everything it owns, irreversibly. Sessions go too. */
  async purge(email: string): Promise<{ email: string; deleted: PurgeCounts }> {
    const account = await this.find(email);
    await this.sessions.revokeAll(account.ID);
    return { email: account.email, deleted: await this.purger.purge([account]) };
  }

  private async find(email: string): Promise<SyntheticAccountRef> {
    if (!isSyntheticEmail(email)) throw new UnknownSyntheticAccount();
    const account = await this.accounts.synthetic(email.trim().toLowerCase());
    if (!account) throw new UnknownSyntheticAccount();
    return account;
  }
}
