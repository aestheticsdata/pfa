import type { OverspendLevel } from "@components/spendings/interfaces/overspendTypes";

export interface BulletSegment {
  level: OverspendLevel;
  /** Left edge, 0–1 fraction of the bar's fixed scale. */
  start: number;
  /** Width, 0–1 fraction of the bar's fixed scale. */
  width: number;
}
