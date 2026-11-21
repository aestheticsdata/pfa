import { AccountsService } from "@contexts/identity/application/accounts.service";
import type {
  Credentials,
  Registration,
  SignInAttempt,
  SignInResponse,
} from "@contexts/identity/domain/interfaces/identityTypes";
import { SessionRegistry } from "@contexts/identity/domain/ports/session-registry";
import { SignInThrottle } from "@contexts/identity/domain/ports/sign-in-throttle";
import { Injectable } from "@nestjs/common";

/**
 * Signing in and up with the throttle and the session registry around it (PFA-260, PFA-296).
 * The controller maps HTTP — the 429, the cookie, the CSRF token, the audit line — and asks
 * this flow for everything else. An exempt client (the bot runner) is never counted.
 */
@Injectable()
export class SignInFlowService {
  constructor(
    private readonly accounts: AccountsService,
    private readonly throttle: SignInThrottle,
    private readonly sessions: SessionRegistry,
  ) {}

  /** Seconds to wait before another try, or null — always null for an exempt client. */
  lockedFor(attempt: SignInAttempt): Promise<number | null> {
    return attempt.exempt ? Promise.resolve(null) : this.throttle.retryAfter(attempt);
  }

  /** A failure counts against the address and the email; a success clears both. */
  async signIn(credentials: Credentials): Promise<SignInResponse> {
    let result: SignInResponse;
    try {
      result = await this.accounts.signIn(credentials.email, credentials.password);
    } catch (error) {
      if (!credentials.exempt) await this.throttle.recordAttempt(credentials);
      throw error;
    }
    if (!credentials.exempt) await this.throttle.clear(credentials);
    return result;
  }

  /** Every sign-up counts, a created account included: nobody needs ten in a quarter of an hour. */
  async signUp(attempt: SignInAttempt, registration: Registration): Promise<SignInResponse> {
    if (!attempt.exempt) await this.throttle.recordAttempt(attempt);
    return this.accounts.register(registration);
  }

  track(accountId: string, sessionId: string): Promise<void> {
    return this.sessions.track(accountId, sessionId);
  }

  untrack(accountId: string, sessionId: string): Promise<void> {
    return this.sessions.untrack(accountId, sessionId);
  }
}
