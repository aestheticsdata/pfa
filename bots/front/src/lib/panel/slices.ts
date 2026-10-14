import { clockTime, slotRange, weekDay } from "@lib/format/format";

import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

/** How long a chart's slice lasts: 15 min in daily pace (`GET /history/day`), 1 s in burst. */
export const SLICE_SECONDS = { day: 15 * 60, burst: 1 } as const;

/**
 * The API scales a burst slice's counts to a per-minute rate (`activityPoints`), its breakdowns
 * by action and bot not: this many times.
 */
export const BURST_RATE_SCALE = 60;

/** `13:15 – 13:30` for a 15-min slice, `17:56:20` for a 1-second one. */
export function sliceSpan(iso: string, seconds: number): string {
  return seconds < 60 ? clockTime(iso) : slotRange(iso, seconds / 60);
}

/** `Wed 14 Oct · 13:15 – 13:30`: the slice's day and span, under a tooltip's or a modal's title. */
export function sliceWhen(iso: string, seconds: number): string {
  return `${weekDay(iso)} · ${sliceSpan(iso, seconds)}`;
}

/** Anything happened in the slice: it has a detail to open. */
export function hasActivity(point: ActivityPoint): boolean {
  return point.actions + point.errors + point.requests > 0;
}

/** A burst slice back to what it counted (its rates divided back down), for its detail. */
export function sliceCounts(point: ActivityPoint, seconds: number): ActivityPoint {
  if (seconds !== SLICE_SECONDS.burst) return point;
  const down = (value: number) => Math.round(value / BURST_RATE_SCALE);
  return {
    ...point,
    actions: down(point.actions),
    errors: down(point.errors),
    requests: down(point.requests),
    codes2xx: down(point.codes2xx),
    codes4xx: down(point.codes4xx),
    codes5xx: down(point.codes5xx),
  };
}
