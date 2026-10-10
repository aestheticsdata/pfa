import type { BotAction } from "@core/interfaces/actionTypes";
import type { AppDefinition } from "@core/interfaces/appTypes";
import type { BotSnapshot } from "@core/interfaces/botTypes";
import type { RunnerLimits, UploadBudgetSnapshot } from "@core/interfaces/limitTypes";
import type { RateLimiter } from "@core/limits/rateLimiter";
import type { UploadBudget } from "@core/limits/uploadBudget";
import type { BotSecrets } from "@core/storage/botSecrets";

/** What survives a restart: the kill switch and the operator's toggles. */
export interface PersistedRunnerState {
  running: boolean;
  disabledBots: string[];
  disabledActions: string[];
}

export interface RunnerDeps<TPersona = unknown> {
  app: AppDefinition<TPersona>;
  actions: BotAction<TPersona>[];
  limits: RunnerLimits;
  limiter: RateLimiter;
  uploads: UploadBudget;
  secrets: BotSecrets;
  initialState: PersistedRunnerState;
  saveState: (state: PersistedRunnerState) => Promise<void>;
}

/** Options of a single visit; the CLI shortens the pauses, the scheduler doesn't. */
export interface WakeOptions {
  actions?: number;
  thinkTimeMs?: number;
  /** Run even while the runner is stopped — the CLI's one-off visit, never the scheduler. */
  force?: boolean;
}

export interface RunnerStatus {
  app: string;
  running: boolean;
  bots: Record<string, number>;
  actionsPerMin: number;
  errorsPerMin: number;
  requestsPerMin: number;
  limits: RunnerLimits;
  uploadBudget: UploadBudgetSnapshot;
}

export interface RunnerView {
  status: RunnerStatus;
  bots: BotSnapshot[];
}
