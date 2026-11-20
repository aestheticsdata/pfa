/**
 * Per-day spending totals for a whole year (GET /daily-stats?year=YYYY).
 *
 * Sparse: only days with at least one spending appear in `days`. Amounts come
 * from the one-off `Spendings` table only — recurrings and exceptionals live in
 * their own tables — so the totals are naturally "hors récurrent / hors
 * exceptionnel". Shared by the Statistics daily heatmap (COS-45) and the
 * day-of-week averages (COS-48): one daily endpoint feeds both.
 */
export interface DailyStat {
  /** ISO date (YYYY-MM-DD, UTC) of the day. */
  date: string;
  /** Sum of that day's spending amounts, rounded to the cent. */
  total: number;
  /** Number of spendings on that day. */
  count: number;
}

export interface DailyStatsResponse {
  /** Chronological, one entry per day that has at least one spending. */
  days: DailyStat[];
}
