import type { PROJECTION_SOURCE } from "@contexts/analytics/domain/projection";
import type { CalendarMonth } from "@shared-kernel/calendar-month";
/** A dated amount as Prisma returns it (`amount` is a Decimal). */
export interface DatedAmount {
  date: Date;
  amount: { toString: () => string };
}

/** One calendar-aligned week slice of a month, as inclusive day-of-month bounds. */
export interface WeekRange {
  startDay: number;
  endDay: number;
}

/** A half-open UTC date range, ready for a Prisma `date` filter. */
export interface DateWindow {
  gte?: Date;
  lt?: Date;
}

/** Which historical period the sparkline projection is based on (COS-27). */
export type ProjectionSource = (typeof PROJECTION_SOURCE)[keyof typeof PROJECTION_SOURCE];

/** One category's slice of the reference month, day by day (PFA-181). */
export interface CategoryDailyTotals {
  /** Category name; null = uncategorized. */
  category: string | null;
  /** Category colour; null = uncategorized/fallback. */
  categoryColor: string | null;
  /** The category's day-by-day totals in the reference month; index i = day (i+1). */
  dailyTotals: number[];
}

export interface DailyProjection {
  source: ProjectionSource;
  /** ISO date (YYYY-MM-DD) of the reference month's first day, or null when source is "none". */
  referenceMonth: string | null;
  /** Day-by-day spending totals of the reference month; index i = day (i+1). */
  dailyTotals: number[];
  /**
   * The same reference month, sliced per category (PFA-181). The chain above is
   * resolved ONCE, globally; this only cuts its result up, so every category is
   * projected from the same month and the slices always add back up to
   * `dailyTotals`. Empty whenever `dailyTotals` is.
   */
  byCategory: CategoryDailyTotals[];
}

/** A month the projection may be based on, in the order the chain tries them. */
export interface ProjectionCandidate {
  source: ProjectionSource;
  month: CalendarMonth;
}

/** A spending as the projection buckets it. */
export interface DatedCategoryAmount {
  date: Date;
  amount: number;
  categoryId: string | null;
}

/** A month bucketed by day, as a whole and per category ID. */
export interface DailyBuckets {
  dailyTotals: number[];
  byCategoryId: Map<string | null, number[]>;
}
