import type { Clock } from "@core/interfaces/limitTypes";

export interface TimeBucketsOptions<T> {
  bucketMs: number;
  /** How many buckets the window holds: `bucketMs × size` is its span. */
  size: number;
  /** A fresh, empty bucket. */
  make: () => T;
  clock?: Clock;
}

/** One slice of the runner's activity: 1 s (the last 80 s) or 15 min (the last 24 h, PFA-206). */
export interface ActivityBucket {
  actions: number;
  errors: number;
  /** Actions that succeeded, by action name (PFA-206: the day chart stacks them). */
  byAction: Record<string, number>;
  /** Actions that failed, by action name (PFA-209: a slice's detail). */
  errorsByAction: Record<string, number>;
  /** Actions run (ok or not), by bot id (PFA-209: who was active in the slice). */
  byBot: Record<string, number>;
  requests: number;
  /** Response times of the requests in the slice, in ms (reduced to p50/p95 on read). */
  latencies: number[];
  codes2xx: number;
  codes4xx: number;
  codes5xx: number;
  /** Bots live and targeted when the slice was sampled. */
  live: number;
  target: number;
  /** The global RPS cap made a request wait during the slice. */
  throttled: boolean;
}

export interface ActivityPoint {
  /** Start of the slice (ISO 8601). */
  at: string;
  actions: number;
  errors: number;
  byAction: Record<string, number>;
  errorsByAction: Record<string, number>;
  byBot: Record<string, number>;
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

/** A bot's own 2-second slice (its last 30 s sparkline). */
export interface BotActivityBucket {
  actions: number;
  errors: number;
}

/** One slice of a rolling window as read, or saved to disk: when it starts (epoch ms) and what it holds. */
export interface StoredSlice<T> {
  at: number;
  bucket: T;
}

/**
 * The day-scale activity (PFA-204): the runner's and each bot's last 24 h in 1-hour slices. Saved
 * to disk, so a restart or a deploy does not blank the back-office's day charts.
 */
export interface DayActivity {
  /**
   * The runner's quarters of an hour, as the live 1-second slices (latencies sampled). Partial: a
   * file written before PFA-205/206 holds 1-hour slices with fewer fields.
   */
  runner: StoredSlice<Partial<ActivityBucket>>[];
  bots: Record<string, StoredSlice<BotActivityBucket>[]>;
}

/** One request a bot sent, for its drawer. */
export interface RecentRequest {
  at: string;
  method: string;
  path: string;
  status: number;
  ms: number;
}
