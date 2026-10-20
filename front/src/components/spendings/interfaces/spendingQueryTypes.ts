import type { CategoryTrendPoint } from "@src/schemas/stats";

/** A date window as the API takes it: inclusive yyyy-MM-dd bounds (PFA-253). */
export interface DateBounds {
  from: string;
  to: string;
}

/** The category-trends comparison: the current window and the one it is compared to. */
export interface CategoryTrendsWindows {
  current: DateBounds;
  previous: DateBounds;
}

/** The spending search: a typed query, optionally narrowed to a year. */
export interface SpendingSearchParams {
  query: string;
  year: number | null;
}

/** Category trends, aggregated per category (the API sends one point per category and week). */
export interface CategoryTrendsResult {
  trends: CategoryTrendPoint[];
  previousTotal: number;
}
