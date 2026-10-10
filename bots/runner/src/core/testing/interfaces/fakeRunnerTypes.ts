import type { BotAction } from "@core/interfaces/actionTypes";
import type { AuthSession } from "@core/interfaces/appTypes";
import type { PersistedRunnerState } from "@core/interfaces/runnerTypes";

export interface FakeRunnerOptions {
  emails?: string[];
  maxBots?: number;
  actions?: BotAction<unknown>[];
  authenticate?: (session: AuthSession<unknown>) => Promise<void>;
  initialState?: PersistedRunnerState;
  saved?: PersistedRunnerState[];
  secretsPath?: string;
}
