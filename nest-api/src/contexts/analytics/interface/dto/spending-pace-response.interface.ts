/**
 * The total one-off spending of each of the three months preceding a reference
 * month (GET /spending-pace?start=YYYY-MM-DD), backing the dashboard's "Sur le
 * rythme" ribbon insight (COS-40). The front turns these into daily rates and
 * compares them to the current month's pace. Counts the one-off `Spendings`
 * table only, so recurrings/exceptionals — which live in their own tables — are
 * excluded by construction, matching the projection and the other ribbon
 * insights. Ordered newest→oldest (M-1, M-2, M-3). A month with no spending
 * comes back as total 0 — the front excludes it rather than averaging in a zero.
 *
 * @example { months: [
 *   { month: "2026-06-01", total: 1240.5 },
 *   { month: "2026-05-01", total: 1310 },
 *   { month: "2026-04-01", total: 0 },
 * ] }
 */
export interface MonthlyTotal {
  /** ISO date (YYYY-MM-DD, UTC) of the month's first day. */
  month: string;
  /** Sum of the month's one-off spendings, rounded to the cent (0 when empty). */
  total: number;
}

export interface SpendingPaceResponse {
  months: MonthlyTotal[];
}
