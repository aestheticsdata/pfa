import type { BotAction } from "@core/interfaces/actionTypes";
import type { AccountAdmin, AuthSession } from "@core/interfaces/appTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";
import type { QuietHours } from "@core/interfaces/timeTypes";

export interface FakeRunnerOptions {
  emails?: string[];
  /** Load bots to add after the daily ones: `load-0`, `load-1`… on the synthetic domain. */
  loadBots?: number;
  maxBots?: number;
  actions?: BotAction<unknown>[];
  authenticate?: (session: AuthSession<unknown>) => Promise<void>;
  initialState?: PersistedRunnerState;
  saved?: PersistedRunnerState[];
  secretsPath?: string;
  quietHours?: QuietHours;
  accounts?: AccountAdmin<unknown>;
}
