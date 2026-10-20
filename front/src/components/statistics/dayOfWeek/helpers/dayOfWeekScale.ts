import { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";
import { LABEL_EDGE_FRAC, SCALE_HEADROOM } from "@components/statistics/dayOfWeek/constants";
import { scaleFrac } from "@components/statistics/helpers/weekdayBullet";

import type { DayOfWeekScale, DayOfWeekScaleInput } from "@components/statistics/interfaces/dayOfWeekTypes";

/** Signed % of `value` relative to `base` (spent-more is positive), or null when there is no base. */
export const deltaPct = (value: number, base: number): number | null => (base > 0 ? (value / base - 1) * 100 : null);

/**
 * One euro scale shared by every mark — both years' averages, the selected year's
 * typical-range highs and the budget markers — so bars, whiskers, the average line
 * and the ticks are all directly comparable (COS-127). The scale reads p90, never
 * the yearly max (COS-182): a single expensive day would otherwise stretch it far
 * enough to squash all seven bars against the left edge.
 */
export const dayOfWeekScale = ({
  stats,
  compareStats,
  overallAvg,
  weeklyCeiling,
}: DayOfWeekScaleInput): DayOfWeekScale => {
  // Per-weekday budget = the weekly ceiling spread over 7 days (COS-34 rule).
  const dayBudget = weeklyCeiling != null && weeklyCeiling > 0 ? weeklyCeiling / 7 : null;

  const rawMax = Math.max(
    ...stats.map((s) => s.avgAmount),
    ...stats.map((s) => s.p90),
    ...(compareStats?.map((s) => s.avgAmount) ?? []),
    1,
  );
  const scaleMax =
    dayBudget != null ? Math.max(rawMax, dayBudget * OVERSPEND_DANGER_RATIO) * SCALE_HEADROOM : rawMax * SCALE_HEADROOM;

  const avgFrac = scaleFrac(overallAvg, scaleMax);
  const dangerBudget = dayBudget != null ? dayBudget * OVERSPEND_DANGER_RATIO : null;
  // Centred on the average line, unless that would push the label out of the plot.
  const avgLabelAlign =
    avgFrac < LABEL_EDGE_FRAC
      ? "translate-x-0"
      : avgFrac > 1 - LABEL_EDGE_FRAC
        ? "-translate-x-full"
        : "-translate-x-1/2";

  return {
    dayBudget,
    dangerBudget,
    scaleMax,
    avgFrac,
    budgetFrac: dayBudget != null ? scaleFrac(dayBudget, scaleMax) : null,
    dangerFrac: dangerBudget != null ? scaleFrac(dangerBudget, scaleMax) : null,
    avgLabelAlign,
  };
};
