import { AccountsService } from "@contexts/identity/application/accounts.service";
import { Account } from "@contexts/identity/domain/account";
import {
  AccountDisabled,
  EmailTaken,
  InvalidCredentials,
  UnknownAccount,
} from "@contexts/identity/domain/identity-errors";
import { BcryptPasswordHasher } from "@contexts/identity/infrastructure/identity-adapters";
import { InMemoryAccountRepository } from "@contexts/identity/infrastructure/testing/in-memory-accounts";
import * as bcrypt from "bcryptjs";

/**
 * Signing in and up (PFA-12, PFA-279): the sign-in guards and the sign-up defaults. Accounts are in
 * memory; bcrypt runs for real at a low cost so the password check is the genuine one.
 */
describe("AccountsService", () => {
  const PASSWORD = "correct horse";

  const stored = (disabledAt: Date | null = null) =>
    Account.restore({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      baseCurrency: "EUR",
      language: "fr",
      registerDate: new Date("2026-01-01"),
      isSynthetic: false,
      disabledAt,
    });

  const makeService = (accounts: Account[] = []) => {
    const repository = new InMemoryAccountRepository(accounts);
    return { service: new AccountsService(repository, new BcryptPasswordHasher()), repository };
  };

  describe("signIn", () => {
    it("rejects an unknown email and a wrong password", async () => {
      const { service } = makeService([stored()]);
      await expect(service.signIn("nobody@example.com", PASSWORD)).rejects.toBeInstanceOf(UnknownAccount);
      await expect(service.signIn("ada@example.com", "wrong")).rejects.toBeInstanceOf(InvalidCredentials);
    });

    it("reveals a disabled account only to someone holding the password", async () => {
      const { service } = makeService([stored(new Date())]);
      await expect(service.signIn("ada@example.com", "wrong")).rejects.toBeInstanceOf(InvalidCredentials);
      await expect(service.signIn("ada@example.com", PASSWORD)).rejects.toBeInstanceOf(AccountDisabled);
    });

    it("returns the public profile without the password hash", async () => {
      await expect(makeService([stored()]).service.signIn("ada@example.com", PASSWORD)).resolves.toEqual({
        user: { id: "user-1", name: "Ada", email: "ada@example.com", baseCurrency: "EUR", language: "fr" },
      });
    });
  });

  describe("register", () => {
    it("refuses an email already registered", async () => {
      const { service, repository } = makeService([stored()]);
      await expect(
        service.register({ name: "Ada", email: "ada@example.com", password: PASSWORD }),
      ).rejects.toBeInstanceOf(EmailTaken);
      expect(repository.accounts).toHaveLength(1);
    });

    it("hashes the password, applies the defaults and flags synthetic accounts", async () => {
      const { service, repository } = makeService();

      await service.register({ name: "Bot", email: "bot@synthetic.test", password: PASSWORD });

      const state = repository.accounts[0].snapshot();
      expect(state).toMatchObject({ baseCurrency: "EUR", language: "fr", isSynthetic: true });
      expect(state.passwordHash).not.toBe(PASSWORD);
      expect(bcrypt.compareSync(PASSWORD, state.passwordHash)).toBe(true);
    });

    it("does not flag a regular email as synthetic", async () => {
      const { service, repository } = makeService();
      await service.register({ name: "Ada", email: "ada@example.com", password: PASSWORD });
      expect(repository.accounts[0].snapshot().isSynthetic).toBe(false);
    });
  });
});
