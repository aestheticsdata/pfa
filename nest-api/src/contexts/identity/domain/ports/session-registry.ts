/**
 * The live sessions of each account (PFA-279, PFA-296); sessions live in Redis. Tracked so an
 * account's sessions can all be ended at once — a disabled bot, a purge.
 */
export abstract class SessionRegistry {
  abstract track(accountId: string, sessionId: string): Promise<void>;
  /** Only this device's session: the user's other devices stay signed in (PFA-256). */
  abstract untrack(accountId: string, sessionId: string): Promise<void>;
  abstract revokeAll(accountId: string): Promise<void>;
}
