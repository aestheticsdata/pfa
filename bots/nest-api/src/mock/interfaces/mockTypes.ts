import type { RunnerBotSpark, RunnerRecentRequest } from "#app/runner/interfaces/runnerApiTypes.js";

/** One simulated bot's live state. */
export interface SimulatedBot {
  id: string;
  email: string;
  kind: string;
  /** Its own pace, actions per minute when live. */
  pace: number;
  /** Fails a lot: shows as "degraded". */
  flaky: boolean;
  enabled: boolean;
  blocked: boolean;
  currentAction: string | null;
  totalActions: number;
  errors: number;
  uploads: number;
  actionsPerMin: number;
  spark: RunnerBotSpark[];
  /** The last 24 h in 1-hour slices, oldest first; the newest is the hour in progress. */
  day: RunnerBotSpark[];
  byAction: Record<string, number>;
  recentRequests: RunnerRecentRequest[];
  sessionStartedAt: number | null;
  lastSeenAt: number | null;
}

/** What a simulated app looks like at boot. */
export interface SimulationSeed {
  seed: number;
  /** False: an app with no bots configured (the picker's second, empty app). */
  populated: boolean;
}

/** One action of the simulated registry. */
export interface SimulatedAction {
  name: string;
  description: string;
  weight: number;
  path: string;
  errorRate: number;
  quiet?: boolean;
  upload?: boolean;
}

/** Who a simulated bot is when created. */
export interface BotSeed {
  id: string;
  kind: string;
  /** Its number: daily bots 0–3, load bots 1–500. */
  n: number;
}

/** One 2-second slice of the simulated runner's activity. */
export interface SimulationSlice {
  at: number;
  actions: number;
  errors: number;
  requests: number;
  latencies: number[];
  codes2xx: number;
  codes4xx: number;
  codes5xx: number;
  live: number;
  target: number;
  throttled: boolean;
}

/** One action a simulated bot runs during a tick. */
export interface ActionRun {
  bot: SimulatedBot;
  usable: SimulatedAction[];
  totalWeight: number;
  slice: SimulationSlice;
  spark: RunnerBotSpark;
  now: number;
}
