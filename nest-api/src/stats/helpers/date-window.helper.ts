import type { DateWindow } from "@stats/interfaces/statsTypes";

/**
 * Turns inclusive calendar-date bounds (yyyy-MM-dd) into a half-open UTC range
 * (`gte`/`lt`), matching how spending dates are stored (calendar date at UTC
 * midnight) and how the daily/yearly stats query. `to` is made inclusive by
 * advancing the exclusive upper bound to the next UTC day. Returns undefined
 * when neither bound is given (all-time).
 */
export function dateWindow(from?: string, to?: string): DateWindow | undefined {
  const window: DateWindow = {};
  if (from) {
    window.gte = new Date(`${from}T00:00:00.000Z`);
  }
  if (to) {
    window.lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
  }
  return window.gte || window.lt ? window : undefined;
}
