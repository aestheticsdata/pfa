import { cx } from "@lib/classNames/cx";

import type { Segment } from "@lib/dataviz/interfaces/dataVizTypes";

interface StackedBarProps {
  segments: Segment[];
  /** Tailwind height class of the bar. */
  className?: string;
  ariaLabel?: string;
  testId?: string;
  /** Faded segments (e.g. an action switched off), by label. */
  faded?: string[];
}

/** Single horizontal stacked bar (e.g. the action mix), with a 2px gap between segments. */
const StackedBar = ({ segments, className, ariaLabel, testId, faded = [] }: StackedBarProps) => {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) || 1;
  return (
    <div
      className={cx("flex w-full gap-0.5 overflow-hidden rounded-tag", className)}
      role="img"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {segments.map((seg) => (
        <span
          key={`${seg.label ?? ""}-${seg.color}`}
          title={seg.label}
          className={cx("block h-full", seg.label && faded.includes(seg.label) && "opacity-35")}
          style={{ width: `${(Math.max(0, seg.value) / total) * 100}%`, background: seg.color }}
        />
      ))}
    </div>
  );
};

export default StackedBar;
