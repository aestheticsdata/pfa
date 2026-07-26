/**
 * The displayed month window, as an inclusive start/end pair of dates.
 *
 * Lives in `lib` rather than in a feature module (COS-176): the dashboard and
 * the spendings page each build their own from the selected date, then thread it
 * down their whole tree — it is a cross-module date range, not a spendings type.
 */
export interface MonthRange {
  start: Date;
  end: Date;
}
