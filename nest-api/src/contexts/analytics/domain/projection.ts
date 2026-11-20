import type {
  DailyBuckets,
  DailyProjection,
  DatedCategoryAmount,
  ProjectionCandidate,
} from "@contexts/analytics/domain/interfaces/analyticsTypes";
import type { CalendarMonth } from "@shared-kernel/calendar-month";

/** Which historical period the sparkline projection is based on (COS-27). */
export const PROJECTION_SOURCE = {
  sameMonthLastYear: "sameMonthLastYear",
  sameMonthTwoYearsAgo: "sameMonthTwoYearsAgo",
  previousMonth: "previousMonth",
  /** The user's very first month of data: no tail at all — never an average fallback. */
  none: "none",
} as const;

export const NO_PROJECTION: DailyProjection = {
  source: PROJECTION_SOURCE.none,
  referenceMonth: null,
  dailyTotals: [],
  byCategory: [],
};

/**
 * The GLOBAL projection chain, in order (COS-27): the same month last year (N-1), two years ago
 * (N-2), then the previous calendar month (M-1). The first one with any spending is the reference.
 */
export function projectionCandidates(viewed: CalendarMonth): ProjectionCandidate[] {
  return [
    { source: PROJECTION_SOURCE.sameMonthLastYear, month: viewed.plusYears(-1) },
    { source: PROJECTION_SOURCE.sameMonthTwoYearsAgo, month: viewed.plusYears(-2) },
    { source: PROJECTION_SOURCE.previousMonth, month: viewed.plusMonths(-1) },
  ];
}

/**
 * A month's spendings day by day, as a whole and per category, in one pass (PFA-181): the slices
 * always add back up to the month, so the two can never tell different stories.
 */
export function dailyBuckets(rows: DatedCategoryAmount[], month: CalendarMonth): DailyBuckets {
  const daysInMonth = month.daysIn();
  const dailyTotals = new Array<number>(daysInMonth).fill(0);
  const byCategoryId = new Map<string | null, number[]>();
  for (const row of rows) {
    const day = row.date.getUTCDate();
    if (day < 1 || day > daysInMonth) continue;
    dailyTotals[day - 1] += row.amount;
    let categoryDaily = byCategoryId.get(row.categoryId);
    if (!categoryDaily) {
      categoryDaily = new Array<number>(daysInMonth).fill(0);
      byCategoryId.set(row.categoryId, categoryDaily);
    }
    categoryDaily[day - 1] += row.amount;
  }
  return { dailyTotals, byCategoryId };
}
