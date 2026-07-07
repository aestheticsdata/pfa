"use client";

import { cn } from "@lib/utils";

interface ProgressTrackProps {
  value: number;
  max: number;
  /** Striped projection extending past `value` (e.g. forecast). */
  projected?: number;
  /** Draws a vertical reference tick (e.g. a budget ceiling). */
  ceiling?: number;
  /** Draws a vertical marker (e.g. "today"), optionally labelled above. */
  marker?: number;
  markerLabel?: string;
  height?: number;
  radius?: number;
  color?: string;
  /** Fill colour for the portion beyond `ceiling`. */
  overColor?: string;
  trackColor?: string;
  className?: string;
  ariaLabel?: string;
}

const pct = (v: number, max: number) =>
  `${Math.max(0, Math.min(100, (v / (max || 1)) * 100))}%`;

/**
 * Versatile horizontal track: a fill (that turns `overColor` past `ceiling`),
 * an optional striped projection, a ceiling tick and a "today" marker.
 * Covers both the forecast strip and the weekly-ceiling bars.
 */
const ProgressTrack = ({
  value,
  max,
  projected,
  ceiling,
  marker,
  markerLabel,
  height = 8,
  radius = 6,
  color = "var(--accent-strong)",
  overColor = "var(--neg)",
  trackColor = "var(--bg-hi)",
  className,
  ariaLabel,
}: ProgressTrackProps) => {
  const over = ceiling != null && value > ceiling;
  const budgetPart = ceiling != null && value > ceiling ? ceiling : value;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height, borderRadius: radius, background: trackColor }}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: radius }}
      >
        {projected != null && projected > value && (
          <span
            className="absolute inset-y-0"
            style={{
              left: pct(value, max),
              width: `calc(${pct(projected, max)} - ${pct(value, max)})`,
              background:
                "repeating-linear-gradient(45deg, transparent 0 6px, var(--accent-bg) 6px 12px)",
              borderLeft: "1px solid var(--accent-d)",
              borderRight: "1px dashed var(--accent-d)",
            }}
          />
        )}
        <span
          className="absolute inset-y-0 left-0"
          style={{ width: pct(budgetPart, max), background: color, opacity: 0.92 }}
        />
        {over && ceiling != null && (
          <span
            className="absolute inset-y-0"
            style={{
              left: pct(ceiling, max),
              width: `calc(${pct(value, max)} - ${pct(ceiling, max)})`,
              background: overColor,
              opacity: 0.95,
            }}
          />
        )}
      </div>

      {ceiling != null && (
        <span
          className="absolute top-0 bottom-0"
          style={{
            left: pct(ceiling, max),
            width: 2,
            marginLeft: -1,
            background: "var(--ink-2)",
          }}
        />
      )}

      {marker != null && (
        <span
          className="absolute"
          style={{
            left: pct(marker, max),
            top: -4,
            bottom: -4,
            width: 2,
            marginLeft: -1,
            background: "var(--ink)",
          }}
        >
          {markerLabel && (
            <span className="num absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-bg-elev px-1.5 py-px text-[11px] text-ink">
              {markerLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default ProgressTrack;
