import getDaysInMonth from "date-fns/getDaysInMonth";

/**
 * Per-month projection helper, following the GLOBAL projection chain shared with
 * the dashboard sparkline (COS-27) and the monthly chart (COS-50): to estimate a
 * month, prefer the same month last year (N-1), then two years ago (N-2), then
 * fall back to the previous calendar month (M-1). The chain resolves per month,
 * so a partial year still projects month by month.
 */
export interface YearMonthly {
  /** 12-slot (Jan→Dec) regular monthly totals. */
  totals: number[];
  /** 12-slot presence mask: true where the year has ≥1 spending that month. */
  present: boolean[];
}

/**
 * Projected *additional* regular spend for the rest of the current year: the
 * remainder of the in-progress month plus full estimates for every later month,
 * each estimated via the chain (N-1 → N-2 → M-1). Exceptionals are never
 * extrapolated — they are one-offs, so only the year's known ones count (added by
 * the caller). Returns null when no historical reference exists at all (the
 * user's very first month of data → no projection is shown).
 *
 * The in-progress month is split: its actual spend so far is already in the
 * caller's cumulative total, so only its remainder is projected here, prorated by
 * the share of the month still ahead (assumes an even daily pace over the
 * reference month).
 */
export const projectedRemainingRegular = (
  current: YearMonthly,
  lastYear: YearMonthly,
  twoYearsAgo: YearMonthly,
  now: Date,
): number | null => {
  const curMonth = now.getMonth();

  // Single M-1 anchor: the previous calendar month's total (wrapping January back
  // to last December), used for any month the two prior years do not cover.
  const prevIdx = (curMonth + 11) % 12;
  const mMinus1 =
    curMonth === 0
      ? lastYear.present[prevIdx]
        ? lastYear.totals[prevIdx]
        : null
      : current.present[prevIdx]
        ? current.totals[prevIdx]
        : null;

  const estimate = (m: number): number | null => {
    if (lastYear.present[m]) return lastYear.totals[m];
    if (twoYearsAgo.present[m]) return twoYearsAgo.totals[m];
    return mMinus1;
  };

  let remaining = 0;
  let hasEstimate = false;

  // In-progress month: only the not-yet-elapsed share is projected.
  const currentEstimate = estimate(curMonth);
  if (currentEstimate !== null) {
    const daysInMonth = getDaysInMonth(now);
    const remainingShare = (daysInMonth - now.getDate()) / daysInMonth;
    remaining += currentEstimate * remainingShare;
    hasEstimate = true;
  }

  // Whole future months.
  for (let m = curMonth + 1; m < 12; m += 1) {
    const monthEstimate = estimate(m);
    if (monthEstimate !== null) {
      remaining += monthEstimate;
      hasEstimate = true;
    }
  }

  return hasEstimate ? remaining : null;
};
