import type { Account } from "@contexts/identity/domain/account";
import type { SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";

/** A driven adapter for unit tests (PFA-279): accounts in memory. */
export class InMemoryAccountRepository extends AccountRepository {
  constructor(readonly accounts: Account[] = []) {
    super();
  }

  async byEmail(email: string): Promise<Account | null> {
    return this.accounts.find((account) => account.snapshot().email === email) ?? null;
  }

  async byId(id: string): Promise<Account | null> {
    return this.accounts.find((account) => account.snapshot().id === id) ?? null;
  }

  async add(account: Account): Promise<void> {
    this.accounts.push(account);
  }

  async setLanguage(id: string): Promise<Account> {
    return (await this.byId(id)) as Account;
  }

  async synthetic(email: string): Promise<SyntheticAccountRef | null> {
    const found = this.accounts.find((account) => account.snapshot().email === email && account.snapshot().isSynthetic);
    return found ? { ID: found.snapshot().id, email } : null;
  }

  async disable(): Promise<void> {}
}
