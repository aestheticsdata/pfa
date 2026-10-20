/** Daily averages shared by the per-weekday and the overall (header) figures. */
export interface DailyAverage {
  /** Average spend per realized day (0 when none). */
  avgAmount: number;
  /** Average number of transactions per realized day. */
  avgTx: number;
}

export interface WeekdayStat extends DailyAverage {
  /** Lowest single-day total among that weekday's spending days (0 when none). */
  min: number;
  /** Highest single-day total among that weekday's spending days (0 when none). */
  max: number;
  /** Low end of the typical range — 10th percentile of that weekday's realized days. */
  p10: number;
  /** High end of the typical range — 90th percentile of the same series. */
  p90: number;
}

export interface WeekdayInsights {
  /** Weekday (0 = Mon) with the highest average spend — the "Peak"; null when no weekday has spending. */
  peakDow: number | null;
  /** Weekday with the lowest positive average spend — the "Low"; null when no weekday has spending. */
  troughDow: number | null;
  /** Weekend (Sat+Sun) vs weekday (Mon–Fri) daily-average, as a signed %; null when weekdays have no spending. */
  weekendDeltaPct: number | null;
}
