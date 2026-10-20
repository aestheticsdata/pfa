import type {
  SEARCH_TIMELINE_BUCKET,
  SEARCH_TIMELINE_RANGE_VALUES,
} from "@components/statistics/helpers/searchTimelineData";

export type SearchTimelineRange = (typeof SEARCH_TIMELINE_RANGE_VALUES)[number];

export type SearchTimelineBucketSize = (typeof SEARCH_TIMELINE_BUCKET)[keyof typeof SEARCH_TIMELINE_BUCKET];

/** The inclusive yyyy-MM-dd calendar window a search timeline covers (PFA-246). */
export interface TimelineWindow {
  from: string;
  to: string;
}

export interface TimelinePoint {
  /** ISO day of the bucket start. */
  date: string;
  total: number;
  count: number;
}

export interface TimelineTick {
  /** Bucket index the label sits under. */
  index: number;
  label: string;
}
