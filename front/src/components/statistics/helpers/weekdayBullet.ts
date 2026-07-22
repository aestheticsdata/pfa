import { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";

import type { OverspendLevel } from "@components/spendings/helpers/overspendLevel";

export interface BulletSegment {
  level: OverspendLevel;
  /** Left edge, 0–1 fraction of the bar's fixed scale. */
  start: number;
  /** Width, 0–1 fraction of the bar's fixed scale. */
  width: number;
}

/** Position of a euro amount on the bar's fixed scale, clamped to 0–1. */
export const scaleFrac = (amount: number, scaleMax: number): number =>
  scaleMax > 0 ? Math.max(0, Math.min(1, amount / scaleMax)) : 0;

/**
 * Split a weekday's average into the green / orange / red segments of its bullet
 * bar (COS-132). The junctions are the daily budget (green→orange) and
 * `OVERSPEND_DANGER_RATIO`× that budget (orange→red) — the exact same thresholds
 * as the Spendings overspend indicators (COS-34 / COS-36). Only the zones the value
 * actually reaches are returned, each as a start/width fraction of the shared
 * fixed scale; the strictly-greater tests mirror `overspendLevel` (at a boundary
 * the value stays in the lower zone).
 */
export function bulletSegments(value: number, dayBudget: number, scaleMax: number): BulletSegment[] {
  const dangerBudget = dayBudget * OVERSPEND_DANGER_RATIO;
  const budgetFrac = scaleFrac(dayBudget, scaleMax);
  const dangerFrac = scaleFrac(dangerBudget, scaleMax);
  const valueFrac = scaleFrac(value, scaleMax);

  const segments: BulletSegment[] = [{ level: "normal", start: 0, width: Math.min(valueFrac, budgetFrac) }];
  if (value > dayBudget) {
    segments.push({ level: "warn", start: budgetFrac, width: Math.min(valueFrac, dangerFrac) - budgetFrac });
  }
  if (value > dangerBudget) {
    segments.push({ level: "danger", start: dangerFrac, width: valueFrac - dangerFrac });
  }
  return segments;
}
