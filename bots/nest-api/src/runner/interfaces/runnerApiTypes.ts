/**
 * What a bot runner's control API answers (`bots/runner/src/core/control/controlServer.ts`), as
 * the back-office reads it. Kept in step with the runner's own `core/interfaces/*Types.ts` by
 * hand: the runner is a separate package with its own module setup, and these are plain data.
 */

export interface RunnerLimits {
  maxBots: number;
  maxRps: number;
  uploadBudgetBytes: number;
  uploadWindowDays: number;
}

export interface RunnerUploadBudget {
  budgetBytes: number;
  usedBytes: number;
  remainingBytes: number;
  uploadsThisWeek: number;
  bytesThisWeek: number;
}

export interface RunnerQuietHours {
  from: string;
  to: string;
  tz: string;
  active: boolean;
  nextChangeAt: string;
}

export interface RunnerRamp {
  step: number;
  everySec: number;
}

export interface RunnerStatus {
  app: string;
  /** Either switch is on: the daily bots, the load bots, or both. */
  running: boolean;
  dailyEnabled: boolean;
  bots: Record<string, number>;
  liveDaily: number;
  totalDaily: number;
  liveLoad: number;
  totalLoad: number;
  target: number;
  spawned: number;
  ramp: RunnerRamp;
  loadEnabled: boolean;
  loadPace: string;
  activeVisits: number;
  maxActiveVisits: number;
  nextStepInSec: number | null;
  actionsPerMin: number;
  errorsPerMin: number;
  requestsPerMin: number;
  rps: number;
  throttled: boolean;
  limits: RunnerLimits;
  uploadBudget: RunnerUploadBudget;
  quietHours: RunnerQuietHours;
}

export interface RunnerActivityPoint {
  at: string;
  actions: number;
  errors: number;
  requests: number;
  p50: number;
  p95: number;
  codes2xx: number;
  codes4xx: number;
  codes5xx: number;
  live: number;
  target: number;
  throttled: boolean;
}

export interface RunnerBotSpark {
  actions: number;
  errors: number;
}

/** Runner bot states: `stopped`, `sleeping`, `active`, `paused`, `blocked`. */
export interface RunnerBot {
  id: string;
  email: string;
  kind: string;
  state: string;
  enabled: boolean;
  currentAction: string | null;
  totalActions: number;
  errors: number;
  uploads: number;
  actionsPerMin: number;
  errorRate: number;
  spark: RunnerBotSpark[];
  /** The last 24 h in 1-hour slices, oldest first (PFA-204). */
  daySpark: RunnerBotSpark[];
  sessionStartedAt: string | null;
  lastSeenAt: string | null;
  nextWakeAt: string | null;
}

export interface RunnerRecentRequest {
  at: string;
  method: string;
  path: string;
  status: number;
  ms: number;
}

export interface RunnerBotDetail extends RunnerBot {
  byAction: Record<string, number>;
  recentRequests: RunnerRecentRequest[];
}

export interface RunnerAction {
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  pausedInQuietHours: boolean;
  usesUploadBudget: boolean;
  runs: number;
  errors: number;
}

export interface RunnerBulkResult {
  updated: string[];
  unknown: string[];
}

export interface RunnerToggle {
  ids: string[];
  enabled: boolean;
}

export interface RunnerQuietHoursInput {
  from: string;
  to: string;
}
