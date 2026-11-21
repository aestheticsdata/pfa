import { AccountDisabled } from "@contexts/identity/domain/identity-errors";
import type {
  AccountState,
  NewAccount,
  Profile,
  Registration,
} from "@contexts/identity/domain/interfaces/identityTypes";
import { isSyntheticEmail } from "@contexts/identity/domain/synthetic-email";

const DEFAULT_CURRENCY = "EUR";
const DEFAULT_LANGUAGE = "fr";

/**
 * A user account (PFA-279) — a generic subdomain, kept thin. Its rules: a bot is recognised once,
 * at sign-up, by its reserved domain; a disabled account cannot sign in, and says so only to
 * someone who knew its password.
 */
export class Account {
  private constructor(private readonly state: AccountState) {}

  static register(registration: Registration, account: NewAccount): Account {
    return new Account({
      id: account.id,
      name: registration.name,
      email: registration.email,
      passwordHash: account.passwordHash,
      baseCurrency: registration.baseCurrency ?? DEFAULT_CURRENCY,
      language: registration.language ?? DEFAULT_LANGUAGE,
      registerDate: registration.registerDate ? new Date(registration.registerDate) : new Date(),
      isSynthetic: isSyntheticEmail(registration.email),
      disabledAt: null,
    });
  }

  static restore(state: AccountState): Account {
    return new Account(state);
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  /** Checked after the password: a stranger learns nothing about the account. */
  assertCanSignIn(): void {
    if (this.state.disabledAt) throw new AccountDisabled();
  }

  profile(): Profile {
    const { id, name, email, baseCurrency, language } = this.state;
    return { id, name, email, baseCurrency, language };
  }

  snapshot(): Readonly<AccountState> {
    return { ...this.state };
  }
}
