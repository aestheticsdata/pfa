import type { SignInAttempt } from "@contexts/identity/domain/interfaces/identityTypes";

/**
 * Failed sign-ins counted per address and per email (PFA-260, PFA-296), so a sustained guess is
 * capped at a handful whichever of the two it rotates.
 */
export abstract class SignInThrottle {
  /** Seconds until the address or the email may try again, or null when neither is locked. */
  abstract retryAfter(attempt: SignInAttempt): Promise<number | null>;
  /** A failed sign-in, or any sign-up. */
  abstract recordAttempt(attempt: SignInAttempt): Promise<void>;
  abstract clear(attempt: SignInAttempt): Promise<void>;
}
