import type { Account } from "@contexts/identity/domain/account";
import type { SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";

export abstract class AccountRepository {
  abstract byEmail(email: string): Promise<Account | null>;
  abstract byId(id: string): Promise<Account | null>;
  abstract add(account: Account): Promise<void>;
  abstract setLanguage(id: string, language: string | undefined): Promise<Account>;
  /** A bot account by email, through the synthetic filter (flag AND reserved domain). */
  abstract synthetic(email: string): Promise<SyntheticAccountRef | null>;
  abstract disable(id: string, at: Date): Promise<void>;
}
