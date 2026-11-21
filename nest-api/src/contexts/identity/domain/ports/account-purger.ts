import type { PurgeCounts, SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";

/** Deletes bot accounts and everything they own, files included (PFA-122), irreversibly. */
export abstract class AccountPurger {
  abstract purge(accounts: SyntheticAccountRef[]): Promise<PurgeCounts>;
}
