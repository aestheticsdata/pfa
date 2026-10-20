import type { SearchTimelineBucketSize } from "@components/statistics/interfaces/searchTimelineTypes";

/** The `/statistics` request (PFA-253): sorted years and category IDs, comma-joined as sent. */
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

/** A calendar month, `month` 0-based like `Date#getMonth`. */
export interface YearMonth {
  year: number;
  month: number;
}
