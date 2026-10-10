import type { AppClient } from "@core/http/appClient";
import type { BotProfile } from "@core/interfaces/botTypes";
import type { UploadBudget } from "@core/limits/uploadBudget";
import type { Rng } from "@core/random/rng";

/** A bot's scratchpad between actions (what it created last, when it last uploaded…). Lives in memory only. */
export type BotMemory = Map<string, unknown>;

/** Everything an action may touch. Nothing else: no database, no other bot, no raw fetch. */
export interface ActionContext<TPersona = unknown> {
  bot: BotProfile<TPersona>;
  /** Already signed in as `bot`. */
  client: AppClient;
  /** Seeded per bot. */
  rng: Rng;
  memory: BotMemory;
  /** The runner-wide upload cap: reserve before uploading, or don't upload. */
  uploads: UploadBudget;
  now: () => Date;
}

/**
 * One thing a bot can do in the app. Drop a file exporting one of these as `default` into the
 * app's `actions/` folder and the runner picks it up — no list to edit anywhere.
 */
export interface BotAction<TPersona = unknown> {
  /** Unique id, e.g. `spending.add`. Shown in the back-office and the logs. */
  name: string;
  description: string;
  /** Relative odds of being picked among the actions that can run. */
  weight: number;
  /** Optional precondition; an action that can't run right now is simply not picked. */
  canRun?: (ctx: ActionContext<TPersona>) => boolean;
  run: (ctx: ActionContext<TPersona>) => Promise<void>;
}

export interface ActionSnapshot {
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  runs: number;
  errors: number;
}
