import { monthlyPresence, monthlyTotals } from "@components/statistics/helpers/statisticsData";
import getDaysInMonth from "date-fns/getDaysInMonth";

import type { StatisticsResponse } from "@src/schemas/stats";

/**
 * Per-month projection helper, following the GLOBAL projection chain shared with
 * the dashboard sparkline (COS-27), the year-end forecast (COS-47) and the
 * monthly chart (COS-50): to estimate a month, prefer the same month last year
 * (N-1), then two years ago (N-2), then fall back to the previous calendar month
 * (M-1). The chain resolves per month, so a partial year still projects month by
 * month.
 */
export interface YearMonthly {
  /** 12-slot (Jan→Dec) regular monthly totals. */
  totals: number[];
  /** 12-slot presence mask: true where the year has ≥1 spending that month. */
  present: boolean[];
}

/** Builds a {@link YearMonthly} for `year` from a `/statistics` response. */
export const toYearMonthly = (data: StatisticsResponse["data"] | undefined, year: number): YearMonthly => ({
  totals: monthlyTotals(data, year),
  present: monthlyPresence(data, year),
});

/**
 * The per-month chain estimator (N-1[m] → N-2[m] → M-1), or null when none of
 * the three has data. M-1 is a single anchor — the previous calendar month of
 * `now` (wrapping January back to last December) — used for any month the two
 * prior years do not cover.
 */
const makeEstimator = (current: YearMonthly, lastYear: YearMonthly, twoYearsAgo: YearMonthly, now: Date) => {
  const curMonth = now.getMonth();
  const prevIdx = (curMonth + 11) % 12;
  const mMinus1 =
    curMonth === 0
      ? lastYear.present[prevIdx]
        ? lastYear.totals[prevIdx]
        : null
      : current.present[prevIdx]
        ? current.totals[prevIdx]
        : null;

  return (m: number): number | null => {
    if (lastYear.present[m]) return lastYear.totals[m];
    if (twoYearsAgo.present[m]) return twoYearsAgo.totals[m];
    return mMinus1;
  };
};

/** Remaining (not-yet-elapsed) share of the current month, assuming an even
 *  daily pace. */
const remainingMonthShare = (now: Date): number => {
  const daysInMonth = getDaysInMonth(now);
  return (daysInMonth - now.getDate()) / daysInMonth;
};

/**
 * Projected end-of-month remainder of the *current* month's regular spend (its
 * chain estimate × the share of the month still ahead), or null when there is no
 * reference (the user's very first month of data → no projection). Exceptionals
 * are never extrapolated; the caller adds the realized total. Backs the monthly
 * chart's projected current-month bar (COS-50).
 */
export const projectedCurrentMonthRemainder = (
  current: YearMonthly,
  lastYear: YearMonthly,
  twoYearsAgo: YearMonthly,
  now: Date,
): number | null => {
  const monthEstimate = makeEstimator(current, lastYear, twoYearsAgo, now)(now.getMonth());
  return monthEstimate === null ? null : monthEstimate * remainingMonthShare(now);
};

/**
 * Projected *additional* regular spend for the rest of the current year: the
 * remainder of the in-progress month plus full estimates for every later month,
 * each estimated via the chain. Exceptionals are never extrapolated — they are
 * one-offs, so only the year's known ones count (added by the caller). Returns
 * null when no historical reference exists at all (COS-47).
 */
export const projectedRemainingRegular = (
  current: YearMonthly,
  lastYear: YearMonthly,
  twoYearsAgo: YearMonthly,
  now: Date,
): number | null => {
  const curMonth = now.getMonth();
  const estimate = makeEstimator(current, lastYear, twoYearsAgo, now);

  let remaining = 0;
  let hasEstimate = false;

  // In-progress month: only the not-yet-elapsed share is projected.
  const currentEstimate = estimate(curMonth);
  if (currentEstimate !== null) {
    remaining += currentEstimate * remainingMonthShare(now);
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
