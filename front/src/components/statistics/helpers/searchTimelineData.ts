// Data shaping for the Statistics search-timeline widget (COS-160): the range
// presets, the window they resolve to, gap-filling of the sparse API buckets
// and the rolling-window frequency series.

import { DATE_FORMAT } from "@components/spendings/config/constants";
import addDays from "date-fns/addDays";
import format from "date-fns/format";
import isAfter from "date-fns/isAfter";
import parseISO from "date-fns/parseISO";
import startOfWeek from "date-fns/startOfWeek";
import subMonths from "date-fns/subMonths";
import subYears from "date-fns/subYears";

import type { SearchTimelineBucket } from "@src/schemas/stats";
import type { Locale } from "date-fns";

export const SEARCH_TIMELINE_RANGE_VALUES = ["month", "year", "threeYears"] as const;
export type SearchTimelineRange = (typeof SEARCH_TIMELINE_RANGE_VALUES)[number];

export type SearchTimelineBucketSize = "day" | "week";

interface SearchTimelineRangeConfig {
  /** Bucket granularity requested from the API (1 bar = 1 day / 1 week). */
  bucket: SearchTimelineBucketSize;
  /** Rolling-frequency window, written in clear next to the frequency band. */
  windowDays: number;
}

// 1 mois / 1 an = daily bars (7 j / 30 j rolling window); 3 ans switches to
// weekly bars with a 90 j window — 1 095 daily bars would out-thin the pixels.
export const SEARCH_TIMELINE_RANGES: Record<SearchTimelineRange, SearchTimelineRangeConfig> = {
  month: { bucket: "day", windowDays: 7 },
  year: { bucket: "day", windowDays: 30 },
  threeYears: { bucket: "week", windowDays: 90 },
};

/**
 * The inclusive [from, to] calendar window of a range ending today (local
 * calendar days — "today" is always resolved client-side, COS-73). Week ranges
 * snap `from` back to the Sunday of its week so the API's Sunday-keyed buckets
 * tile the window exactly.
 */
export const searchTimelineWindow = (range: SearchTimelineRange, today: Date): { from: string; to: string } => {
  const spanStart =
    range === "month" ? addDays(subMonths(today, 1), 1) : addDays(subYears(today, range === "year" ? 1 : 3), 1);
  const from =
    SEARCH_TIMELINE_RANGES[range].bucket === "week" ? startOfWeek(spanStart, { weekStartsOn: 0 }) : spanStart;
  return { from: format(from, DATE_FORMAT), to: format(today, DATE_FORMAT) };
};

export interface TimelinePoint {
  /** ISO day of the bucket start. */
  date: string;
  total: number;
  count: number;
}

/**
 * Materializes the sparse API buckets into a dense series over [from, to] —
 * one point per day, or per Sunday-keyed week — zero-filling the gaps the
 * backend deliberately omits.
 */
export const fillTimeline = (
  buckets: SearchTimelineBucket[],
  from: string,
  to: string,
  bucket: SearchTimelineBucketSize,
): TimelinePoint[] => {
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  const end = parseISO(to);
  const step = bucket === "week" ? 7 : 1;
  const points: TimelinePoint[] = [];
  for (let day = parseISO(from); !isAfter(day, end); day = addDays(day, step)) {
    const key = format(day, DATE_FORMAT);
    const hit = byDate.get(key);
    points.push({ date: key, total: hit?.total ?? 0, count: hit?.count ?? 0 });
  }
  return points;
};

/** Buckets covered by the rolling window (13 weekly buckets ≈ the 90 j window). */
export const rollingWindowBuckets = (range: SearchTimelineRange): number => {
  const { bucket, windowDays } = SEARCH_TIMELINE_RANGES[range];
  return bucket === "week" ? Math.round(windowDays / 7) : windowDays;
};

/**
 * Trailing-window occurrence counts — point i sums the counts of the
 * `windowBuckets` buckets ending at i. The window truncates at the left edge
 * (matches before `from` are unknown), so the curve ramps up over the first
 * window's width.
 */
export const rollingCounts = (points: TimelinePoint[], windowBuckets: number): number[] => {
  const counts: number[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    sum += points[i].count;
    if (i >= windowBuckets) sum -= points[i - windowBuckets].count;
    counts.push(sum);
  }
  return counts;
};

export interface TimelineTick {
  /** Bucket index the label sits under. */
  index: number;
  label: string;
}

/**
 * Sparse x-axis labels, one strategy per range: 1 mois → every 7th day
 * ("d MMM"), 1 an → the 1st of every other month ("MMM"), 3 ans → the first
 * week of each quarter ("MMM yy").
 */
export const timelineTicks = (points: TimelinePoint[], range: SearchTimelineRange, locale: Locale): TimelineTick[] => {
  const ticks: TimelineTick[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const date = parseISO(points[i].date);
    let label: string | null = null;
    if (range === "month") {
      if (i % 7 === 0) label = format(date, "d MMM", { locale });
    } else if (range === "year") {
      if (date.getDate() === 1 && date.getMonth() % 2 === 0) label = format(date, "MMM", { locale });
    } else if (date.getDate() <= 7 && date.getMonth() % 3 === 0) {
      label = format(date, "MMM yy", { locale });
    }
    if (label) ticks.push({ index: i, label });
  }
  return ticks;
};
