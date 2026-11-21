import { randomUUID } from "node:crypto";
import { Account } from "@contexts/identity/domain/account";
import {
  EmailTaken,
  InvalidCredentials,
  SessionAccountGone,
  UnknownAccount,
} from "@contexts/identity/domain/identity-errors";
import type { Registration, SignInResponse } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";
import { PasswordHasher } from "@contexts/identity/domain/ports/password-hasher";
import { Injectable } from "@nestjs/common";

/**
 * Signing in and up, and the signed-in user's own profile (PFA-279). The session itself is the
 * HTTP edge's business: this service answers who the user is, never how the cookie is kept.
 */
@Injectable()
export class AccountsService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async signIn(email: string, password: string): Promise<SignInResponse> {
    const account = await this.accounts.byEmail(email);
    if (!account) throw new UnknownAccount();
    if (!(await this.passwords.matches(password, account.passwordHash))) throw new InvalidCredentials();
    account.assertCanSignIn();
    return { user: account.profile() };
  }

  async register(registration: Registration): Promise<SignInResponse> {
    if (await this.accounts.byEmail(registration.email)) throw new EmailTaken();
    const account = Account.register(registration, {
      id: randomUUID(),
      passwordHash: await this.passwords.hash(registration.password),
    });
    await this.accounts.add(account);
    return { user: account.profile() };
  }

  async setLanguage(accountId: string, language: string | undefined): Promise<SignInResponse> {
    return { user: (await this.accounts.setLanguage(accountId, language)).profile() };
  }

  async profile(accountId: string): Promise<SignInResponse> {
    const account = await this.accounts.byId(accountId);
    if (!account) throw new SessionAccountGone();
    return { user: account.profile() };
  }
}
