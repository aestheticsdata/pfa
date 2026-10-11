import type {
  RunnerAction,
  RunnerActivityPoint,
  RunnerBot,
  RunnerBotDetail,
  RunnerBulkResult,
  RunnerQuietHours,
  RunnerQuietHoursInput,
  RunnerRamp,
  RunnerStatus,
  RunnerToggle,
} from "#app/runner/interfaces/runnerApiTypes.js";

/**
 * One app's runner, as the back-office drives it. Two implementations behind it: the real control
 * API over loopback HTTP, and the simulated runner of mock mode (local dev, portfolio film).
 */
export interface RunnerClient {
  status(): Promise<RunnerStatus>;
  history(): Promise<RunnerActivityPoint[]>;
  bots(): Promise<RunnerBot[]>;
  bot(id: string): Promise<RunnerBotDetail | null>;
  actions(): Promise<RunnerAction[]>;
  /** The "Daily bots" switch. */
  setDaily(enabled: boolean): Promise<boolean>;
  setTarget(target: number): Promise<number>;
  setRamp(ramp: RunnerRamp): Promise<RunnerRamp>;
  /** The "Load bots" switch. */
  setLoad(enabled: boolean): Promise<boolean>;
  setLoadPace(pace: string): Promise<string>;
  setQuietHours(hours: RunnerQuietHoursInput): Promise<RunnerQuietHours>;
  setBots(toggle: RunnerToggle): Promise<RunnerBulkResult>;
  restartSession(id: string): Promise<boolean>;
  setAction(name: string, enabled: boolean): Promise<boolean>;
  enableAllActions(): Promise<void>;
  /** Disables (or purges) the bot's account in its app, then blocks the bot. */
  closeAccount(id: string, purge: boolean): Promise<boolean>;
}

/** Where a runner's control API answers, and its token. */
export interface RunnerEndpoint {
  url: string;
  token: string;
}
