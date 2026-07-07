"use client";

import { cn } from "@lib/utils";

import type { DonutSegment } from "@components/dataviz/types";

interface StackedBarProps {
  segments: DonutSegment[];
  height?: number;
  radius?: number;
  className?: string;
  ariaLabel?: string;
}

/** Single horizontal stacked bar (e.g. a category distribution). */
const StackedBar = ({
  segments,
  height = 8,
  radius = 4,
  className,
  ariaLabel,
}: StackedBarProps) => {
  const total =
    segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) || 1;

  return (
    <div
      className={cn("flex w-full overflow-hidden", className)}
      style={{ height, borderRadius: radius }}
      role="img"
      aria-label={ariaLabel}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          className="block h-full"
          style={{
            width: `${(Math.max(0, seg.value) / total) * 100}%`,
            background: seg.color,
          }}
        />
      ))}
    </div>
  );
};

export default StackedBar;
