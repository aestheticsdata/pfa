import type { SearchTimelineBucketSize } from "#schemas/stats";

/** A calendar window, both bounds as yyyy-MM-dd and inclusive. */
export interface DateBounds {
  from: string;
  to: string;
}

/** The category-trends comparison: the current window and the one it is compared to. */
export interface CategoryTrendsWindows {
  current: DateBounds;
  previous: DateBounds;
}

/** One page of the spending search: a typed query, optionally narrowed to a year, from a cursor. */
export interface SpendingSearchParams {
  query: string;
  year: number | null;
  cursor?: string;
}

/** GET /statistics: comma-separated years and category IDs, as the web sends them. */
export interface StatisticsParams {
  years: string;
  categoryIds: string;
}

/** The search-timeline request: a term over a calendar window, bucketed by day or week. */
export interface SearchTimelineParams {
  query: string;
  from: string;
  to: string;
  bucket: SearchTimelineBucketSize;
}

export interface YearMonth {
  year: number;
  month: number;
}

/** A row identified by its ID, with the fields being written. */
export interface Identified<Payload> {
  id: string;
  payload: Payload;
}
