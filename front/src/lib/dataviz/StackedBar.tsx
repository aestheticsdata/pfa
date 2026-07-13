"use client";

import type { DonutSegment } from "@lib/dataviz/dataVizTypes";
import { cn } from "@lib/utils";
import type { MouseEvent } from "react";

interface StackedBarProps {
  segments: DonutSegment[];
  height?: number;
  radius?: number;
  className?: string;
  ariaLabel?: string;
  /** Fires on pointer move over the bar with the segment index under the cursor. */
  onSegmentHover?: (index: number, event: MouseEvent) => void;
  /** Fires when the pointer leaves the bar. */
  onSegmentLeave?: () => void;
}

/** Single horizontal stacked bar (e.g. a category distribution). */
const StackedBar = ({
  segments,
  height = 8,
  radius = 4,
  className,
  ariaLabel,
  onSegmentHover,
  onSegmentLeave,
}: StackedBarProps) => {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) || 1;

  // Hit-test the pointer against the same width fractions the segments render
  // with, then report the segment (with the event) so the caller can drive a
  // follow-cursor tooltip — no per-segment handlers, so the bar stays a single
  // labelled image for assistive tech.
  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSegmentHover) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / (rect.width || 1);
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      acc += Math.max(0, segments[i].value) / total;
      if (ratio <= acc) {
        onSegmentHover(i, event);
        return;
      }
    }
    onSegmentHover(segments.length - 1, event);
  };

  return (
    <div
      className={cn("flex w-full overflow-hidden", className)}
      style={{ height, borderRadius: radius }}
      role="img"
      aria-label={ariaLabel}
      onMouseMove={onSegmentHover ? handleMove : undefined}
      onMouseLeave={onSegmentLeave}
    >
      {segments.map((seg) => (
        <span
          key={`${seg.label ?? ""}-${seg.color}`}
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
