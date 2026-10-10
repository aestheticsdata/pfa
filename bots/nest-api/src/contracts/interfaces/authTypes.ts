/**
 * The back-office API's contract with its front, auth half. No imports: the front (`bots/front`)
 * reads the contract folder through a path alias, so every file in it must stand on its own.
 */

/** What the auth screens need to decide which one to show. */
export interface AuthState {
  /** The one admin account exists: `/setup` shows the sealed state. */
  accountExists: boolean;
  signedIn: boolean;
  email: string | null;
  /** Present when signed in: every unsafe request carries it in `x-csrf-token`. */
  csrfToken: string | null;
}

/** The body of any refused request. */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  /** One of `AUTH_ERROR` (contracts/authErrors.ts), or another module's code. */
  errorCode?: string;
  /** On a 429: how long until the window closes. */
  retryAfterSec?: number;
}
