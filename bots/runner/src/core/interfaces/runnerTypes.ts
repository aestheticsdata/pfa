import type { BotAction } from "@core/interfaces/actionTypes";
import type { AppDefinition } from "@core/interfaces/appTypes";
import type { BotSnapshot } from "@core/interfaces/botTypes";
import type { RunnerLimits, UploadBudgetSnapshot } from "@core/interfaces/limitTypes";
import type { QuietHours, QuietHoursSnapshot } from "@core/interfaces/timeTypes";
import type { RateLimiter } from "@core/limits/rateLimiter";
import type { UploadBudget } from "@core/limits/uploadBudget";
import type { BotSecrets } from "@core/storage/botSecrets";

/** How load bots come up toward the target (PFA-128 spawns them; PFA-127 sets it). */
export interface RampSettings {
  step: number;
  everySec: number;
}

/** What survives a restart: the kill switch and the operator's settings. */
export interface PersistedRunnerState {
  running: boolean;
  disabledBots: string[];
  disabledActions: string[];
  /** Accounts disabled or purged from the back-office: never signed in again (nor re-created). */
  blockedBots?: string[];
  /** Set from the back-office; absent = the app's default. */
  quietHours?: QuietHours;
  /** Load-bot target, ≤ the hard cap; absent = 0. */
  target?: number;
  ramp?: RampSettings;
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
  /** Bots per state. */
  bots: Record<string, number>;
  liveDaily: number;
  totalDaily: number;
  liveLoad: number;
  totalLoad: number;
  /** Load bots asked for, and how many are up (load bots arrive with PFA-128). */
  target: number;
  spawned: number;
  ramp: RampSettings;
  /** Seconds until the ramp adds the next step of load bots; null when there is nothing to ramp. */
  nextStepInSec: number | null;
  actionsPerMin: number;
  errorsPerMin: number;
  requestsPerMin: number;
  /** Requests per second over the last 10 s. */
  rps: number;
  /** The RPS cap made a request wait in the last 10 s. */
  throttled: boolean;
  limits: RunnerLimits;
  uploadBudget: UploadBudgetSnapshot;
  quietHours: QuietHoursSnapshot;
}

export interface RunnerView {
  status: RunnerStatus;
  bots: BotSnapshot[];
}
