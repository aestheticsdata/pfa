import type { AppClient } from "@core/http/appClient";
import type { BotProfile } from "@core/interfaces/botTypes";

export interface AuthSession<TPersona = unknown> {
  bot: BotProfile<TPersona>;
  client: AppClient;
  password: string;
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
  /** Every bot email must be on this domain (PFA-122). */
  syntheticDomain: string;
  bots: BotProfile<TPersona>[];
  /** Absolute path of the folder whose files are the app's actions. */
  actionsDir: string;
  /**
   * Signs the bot in, signing it up first if it has no account yet. Throws `BotBlockedError` when
   * the account can't be used at all, so the runner stops retrying it.
   */
  authenticate: (session: AuthSession<TPersona>) => Promise<void>;
}
