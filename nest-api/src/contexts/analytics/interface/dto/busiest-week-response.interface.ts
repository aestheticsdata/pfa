/**
 * The calendar week-range of a month with the most one-off spendings
 * (GET /busiest-week?start=YYYY-MM-DD), backing the dashboard's 4th ribbon
 * insight (COS-139). "Week" = the month's calendar-aligned Sun→Sat ranges,
 * truncated at the month edges — the same slices the rest of the app shows
 * (datepicker, Dépenses, weekly ceiling), NOT a rolling 7-day window. Counts the
 * one-off `Spendings` table only, so recurrings/exceptionals — which live in
 * their own tables — are excluded by construction. Ties resolve to the earliest
 * range. `from`/`to` are null when the month has no spending.
 *
 * @example { count: 9, from: "2026-06-07", to: "2026-06-13" }
 */
export interface BusiestWeekResponse {
  /** Number of spendings in the busiest range (0 when the month is empty). */
  count: number;
  /** ISO date (YYYY-MM-DD, UTC) of the range's first day, or null when empty. */
  from: string | null;
  /** ISO date (YYYY-MM-DD, UTC) of the range's last day, or null when empty. */
  to: string | null;
}
