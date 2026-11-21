import type { AccountsService } from "@contexts/identity/application/accounts.service";
import { SignInFlowService } from "@contexts/identity/application/sign-in-flow.service";
import { InvalidCredentials } from "@contexts/identity/domain/identity-errors";
import type { SignInAttempt } from "@contexts/identity/domain/interfaces/identityTypes";
import { SessionRegistry } from "@contexts/identity/domain/ports/session-registry";
import { SignInThrottle } from "@contexts/identity/domain/ports/sign-in-throttle";

class FakeThrottle extends SignInThrottle {
  readonly recorded: string[] = [];
  readonly cleared: string[] = [];
  constructor(private readonly locked: number | null = null) {
    super();
  }
  async retryAfter(): Promise<number | null> {
    return this.locked;
  }
  async recordAttempt(attempt: SignInAttempt): Promise<void> {
    this.recorded.push(attempt.email);
  }
  async clear(attempt: SignInAttempt): Promise<void> {
    this.cleared.push(attempt.email);
  }
}

class FakeSessions extends SessionRegistry {
  async track(): Promise<void> {}
  async untrack(): Promise<void> {}
  async revokeAll(): Promise<void> {}
}

/** PFA-260/296 — the throttle around sign-in and sign-up; the bot runner is never counted. */
describe("SignInFlowService", () => {
  const profile = { user: { id: "u1", name: "Ada", email: "ada@example.com", baseCurrency: "EUR", language: "fr" } };
  const accounts = (fails: boolean) =>
    ({
      signIn: jest.fn(() => (fails ? Promise.reject(new InvalidCredentials()) : Promise.resolve(profile))),
      register: jest.fn().mockResolvedValue(profile),
    }) as unknown as AccountsService;
  const attempt = (exempt = false): SignInAttempt => ({ email: "ada@example.com", ip: "1.1.1.1", exempt });

  it("counts a failure, and clears the count on success", async () => {
    const throttle = new FakeThrottle();
    await expect(
      new SignInFlowService(accounts(true), throttle, new FakeSessions()).signIn({ ...attempt(), password: "x" }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
    await new SignInFlowService(accounts(false), throttle, new FakeSessions()).signIn({ ...attempt(), password: "x" });

    expect([throttle.recorded, throttle.cleared]).toEqual([["ada@example.com"], ["ada@example.com"]]);
  });

  it("never counts nor locks the exempt bot runner", async () => {
    const throttle = new FakeThrottle(900);
    const flow = new SignInFlowService(accounts(true), throttle, new FakeSessions());

    await expect(flow.lockedFor(attempt(true))).resolves.toBeNull();
    await expect(flow.signIn({ ...attempt(true), password: "x" })).rejects.toBeInstanceOf(InvalidCredentials);
    await flow.signUp(attempt(true), { name: "Bot", email: "bot@synthetic.test", password: "x" });

    expect(throttle.recorded).toEqual([]);
  });

  it("reports the lock, and counts every sign-up", async () => {
    const throttle = new FakeThrottle(900);
    const flow = new SignInFlowService(accounts(false), throttle, new FakeSessions());

    await expect(flow.lockedFor(attempt())).resolves.toBe(900);
    await flow.signUp(attempt(), { name: "Ada", email: "ada@example.com", password: "x" });

    expect(throttle.recorded).toEqual(["ada@example.com"]);
  });
});
