/**
 * Time distribution of the spendings matching a search term
 * (GET /search-timeline?q=&from=&to=&bucket=day|week) — COS-160.
 *
 * Matching reuses the whole-history search clause (label OR accessible category
 * name, see @spendings/search-where.helper), over the one-off `Spendings` table
 * only — recurrings/exceptionals live in their own tables and are out of scope.
 * Sparse: only buckets with at least one match are returned (the front fills
 * the gaps), sorted chronologically.
 */
export interface SearchTimelineBucket {
  /** ISO date (YYYY-MM-DD, UTC) of the bucket start — the day itself, or the
   *  Sunday of the week (calendar weeks run Sun→Sat across the app). */
  date: string;
  /** Sum of the bucket's matching amounts, rounded to the cent. */
  total: number;
  /** Number of matching spendings in the bucket. */
  count: number;
}

export interface SearchTimelineSummary {
  /** Sum over the whole window, rounded to the cent. */
  total: number;
  count: number;
  /** ISO day of the earliest / latest match in the window; null when none. */
  firstDate: string | null;
  lastDate: string | null;
}

export interface SearchTimelineResponse {
  buckets: SearchTimelineBucket[];
  summary: SearchTimelineSummary;
}
