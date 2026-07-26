/**
 * One calendar week-slice of a month, as day-of-month bounds (inclusive).
 *
 * Weeks are Sunday→Saturday, truncated at the month edges — so a month can open
 * with a 1–3 slice and close with a 29–31 one. A single-day slice has
 * `start === end`. Formatting is the view's job (COS-109): this used to be an
 * `Array<string | number>` where a range was the string "5 - 11" and a lone day a
 * bare number, which every consumer then re-parsed to get the start day back.
 */
export interface WeekSlice {
  start: number;
  end: number;
}
