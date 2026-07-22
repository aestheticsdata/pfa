import type { CategoryTrendData } from "@lib/dataviz";

/** Below this |Δ%|, a category is shown as "stable" rather than up/down. */
export const STABLE_TREND_THRESHOLD = 3;

/**
 * A category's change vs the comparison period, as a percentage of that period.
 * Null when the category had no spending in it (it is new — no % to compute).
 */
export const categoryDeltaPct = (value: number, previousValue: number | null): number | null =>
  previousValue != null && previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : null;

/**
 * Trend badge data (direction + label) for a category, from its current vs
 * comparison-period totals. Spend-oriented semantics: more spending is "up"
 * (rendered red), less is "down" (green); a small change is "stable" and a
 * category absent from the comparison period is "new" — both grey. Shared by
 * the dashboard breakdown + insight (COS-41) and, later, the Spendings weekly
 * breakdown (COS-35), so the badge reads identically everywhere.
 */
export const categoryTrend = (
  value: number,
  previousValue: number | null,
  labels: { stable: string; fresh: string },
): CategoryTrendData => {
  const delta = categoryDeltaPct(value, previousValue);
  if (delta === null) return { direction: "flat", label: labels.fresh };
  if (Math.abs(delta) < STABLE_TREND_THRESHOLD) return { direction: "flat", label: labels.stable };
  return delta > 0
    ? { direction: "up", label: `+${Math.round(delta)}%` }
    : { direction: "down", label: `−${Math.round(Math.abs(delta))}%` };
};
