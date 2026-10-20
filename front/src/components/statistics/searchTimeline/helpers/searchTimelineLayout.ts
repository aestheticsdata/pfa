import { parseISO } from "date-fns";

import type { TimelineWindow } from "@components/statistics/interfaces/searchTimelineTypes";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fine bars (COS-160): a width-proportional slot per bucket, the bar clamped so a
 * year of daily buckets stays legible and a month's bars don't balloon.
 */
export const barLayout = (width: number, bucketCount: number) => {
  const slot = bucketCount > 0 ? width / bucketCount : 0;
  return { slot, barWidth: Math.max(1.3, Math.min(6, slot * 0.66)) };
};

/** The bucket under the cursor, by its x position across the chart (clamped to the series). */
export const bucketAt = (clientX: number, rect: DOMRect, bucketCount: number): number =>
  Math.min(bucketCount - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * bucketCount)));

/** Cadence: the window's span over the match count, in whole days (0 without a match). */
export const cadenceDays = ({ from, to }: TimelineWindow, count: number): number => {
  if (count <= 0) return 0;
  const spanDays = Math.max(1, Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS));
  return Math.round(spanDays / count);
};
