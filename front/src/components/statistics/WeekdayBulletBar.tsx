import { bulletSegments } from "@components/statistics/helpers/weekdayBullet";

import type { OverspendLevel } from "@components/spendings/helpers/overspendLevel";

interface WeekdayBulletBarProps {
  /** The weekday's average spend, in euros. */
  value: number;
  /** Per-day budget = weekly ceiling ÷ 7, in euros (never null here). */
  dayBudget: number;
  /** Fixed euro scale shared by all seven bars, so the thresholds line up. */
  scaleMax: number;
  /** Track height in px. */
  height: number;
}

// Fill per overspend zone: the green base keeps the accent gradient (it is
// anchored at 0), the overspend zones are the flat warn / neg tokens — same
// palette as the Dépenses overspend indicators (COS-34 / COS-36).
const SEGMENT_FILL: Record<OverspendLevel, string> = {
  normal: "var(--bar-fill)",
  warn: "var(--warn)",
  danger: "var(--neg)",
};

/**
 * Bullet-chart bar for one weekday (COS-132): the green / orange / red overspend
 * zones share a single bar on a fixed scale. `MeterBar` stays single-fill
 * ("multi-segment bars stay bespoke"), so the segments are drawn here. The two
 * dashed threshold markers are a single continuous guide drawn once over all
 * seven rows by the parent, not per bar.
 */
const WeekdayBulletBar = ({ value, dayBudget, scaleMax, height }: WeekdayBulletBarProps) => {
  const segments = bulletSegments(value, dayBudget, scaleMax);

  return (
    <div
      className="relative overflow-hidden rounded-sm bg-surface-hi"
      style={{ height }}
    >
      {segments.map((seg) => (
        <span
          key={seg.level}
          className="absolute inset-y-0 rounded-sm"
          style={{
            left: `${seg.start * 100}%`,
            width: `${seg.width * 100}%`,
            background: SEGMENT_FILL[seg.level],
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
};

export default WeekdayBulletBar;
