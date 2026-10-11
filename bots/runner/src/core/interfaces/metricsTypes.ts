import type { Clock } from "@core/interfaces/limitTypes";

export interface TimeBucketsOptions<T> {
  bucketMs: number;
  /** How many buckets the window holds: `bucketMs × size` is its span. */
  size: number;
  /** A fresh, empty bucket. */
  make: () => T;
  clock?: Clock;
}

/** One 1-second slice of the runner's activity, as the back-office charts it (last 80 s). */
export interface ActivityBucket {
  actions: number;
  errors: number;
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
  runner: StoredSlice<BotActivityBucket>[];
  bots: Record<string, StoredSlice<BotActivityBucket>[]>;
}

/** One hour of the last 24, for the back-office's day chart. */
export interface DayPoint {
  /** Start of the hour (ISO 8601). */
  at: string;
  actions: number;
  errors: number;
}

/** One request a bot sent, for its drawer. */
export interface RecentRequest {
  at: string;
  method: string;
  path: string;
  status: number;
  ms: number;
}
