import type { AppClient } from "@core/http/appClient";
import type { BotProfile } from "@core/interfaces/botTypes";
import type { QuietHours } from "@core/interfaces/timeTypes";

export interface AuthSession<TPersona = unknown> {
  bot: BotProfile<TPersona>;
  client: AppClient;
  password: string;
}

/**
 * How the back-office's "Disable / purge account" reaches the app (PFA-127). Optional: an app
 * without it simply can't be asked, and the control API answers 501.
 */
export interface AccountAdmin<TPersona = unknown> {
  /** Sign-in refused from now on, sessions revoked, data kept. */
  disable: (bot: BotProfile<TPersona>) => Promise<void>;
  /** The account and its data, gone. */
  purge: (bot: BotProfile<TPersona>) => Promise<void>;
}

/**
 * What an app plugs into the runner (the "adapter"). The core knows nothing else about the app:
 * its URL, its synthetic domain, its bots, where its actions live, and how a bot signs in.
 */
export interface AppDefinition<TPersona = unknown> {
  id: string;
  name: string;
  /** Base URL of the app's API, the public one: bots go through nginx like everyone. */
  baseUrl: string;
  /** The bots' clock (IANA name): waking hours and quiet hours are read in it, whatever the server's zone. */
  timeZone: string;
  /** Quiet hours until the operator changes them from the back-office. */
  defaultQuietHours: QuietHours;
  /** Every bot email must be on this domain (PFA-122). */
  syntheticDomain: string;
  /**
   * How long the app keeps a session without a request. A bot idle for longer signs in again
   * before its next action, as a person coming back would (PFA-213).
   */
  sessionIdleMs: number;
  /** The permanent "daily" bots: always there, never counted in the load target. */
  bots: BotProfile<TPersona>[];
  /**
   * The load bots, in the order the ramp brings them up (PFA-128). The runner keeps the first
   * `maxBots` of them — the hard cap — and starts as many as the operator's target asks for.
   */
  loadBots?: BotProfile<TPersona>[];
  /** Absolute path of the folder whose files are the app's actions. */
  actionsDir: string;
  /**
   * Signs the bot in, signing it up first if it has no account yet. Throws `BotBlockedError` when
   * the account can't be used at all, so the runner stops retrying it.
   */
  authenticate: (session: AuthSession<TPersona>) => Promise<void>;
  accounts?: AccountAdmin<TPersona>;
}
