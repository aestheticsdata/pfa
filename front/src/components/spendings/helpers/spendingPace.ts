import getDaysInMonth from "date-fns/getDaysInMonth";
import parseISO from "date-fns/parseISO";

import type { MonthlyTotal } from "@src/schemas/stats";

/**
 * Days that must have elapsed in the current month before its daily rate is
 * stable enough to compare — under a week, one purchase swings the pace wildly.
 * Past months are always full, so this only gates the in-progress month.
 */
export const PACE_MIN_DAYS = 7;

export interface PaceComparison {
  /** Signed gap of the current daily rate vs the recent average, as a % (>0 = faster). */
  deltaPct: number;
  /** True when the current month is spending faster than the recent average. */
  faster: boolean;
}

/**
 * The current month's spending pace vs the average daily rate of the preceding
 * months that had spending (COS-40). Each month contributes its own daily rate
 * (total ÷ days in that month); the rates are averaged equally. Months with no
 * spending are excluded rather than averaged in as a zero — the same
 * "no average-of-nothing" spirit as the projection chain — so a fresh user with
 * only one prior active month still gets a real comparison.
 *
 * Null — meaning "not enough data, show the waiting copy instead of a figure" —
 * when either input is too thin to be trustworthy: fewer than `PACE_MIN_DAYS`
 * elapsed this month (rate too noisy) or no prior month with spending (no
 * baseline). `elapsedDays` is the days elapsed in the current month, or the
 * month's full length when viewing a past month.
 */
export const spendingPaceDelta = (
  monthlyTotal: number,
  elapsedDays: number,
  previousMonths: readonly MonthlyTotal[],
): PaceComparison | null => {
  if (elapsedDays < PACE_MIN_DAYS) return null;
  const rates = previousMonths.filter((m) => m.total > 0).map((m) => m.total / getDaysInMonth(parseISO(m.month)));
  if (rates.length === 0) return null;
  const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  if (averageRate <= 0) return null;
  const deltaPct = ((monthlyTotal / elapsedDays - averageRate) / averageRate) * 100;
  return { deltaPct, faster: deltaPct > 0 };
};
