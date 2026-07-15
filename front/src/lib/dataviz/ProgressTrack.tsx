"use client";

import useTween from "@lib/dataviz/useTween";
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
  /** Render the fill as a left→right accent gradient at reduced opacity
   *  (the forecast "réalisé" look) instead of a flat colour. */
  gradient?: boolean;
  /** Animate the segments. On mount / remount (via a `key`) they grow from zero;
   *  on a live value change they ease from their current width to the new one. */
  animate?: boolean;
  /** Delay (seconds) before the animation starts — for staggering a list. */
  animationDelay?: number;
  /** Fill colour for the portion beyond `ceiling`. */
  overColor?: string;
  trackColor?: string;
  className?: string;
  ariaLabel?: string;
}

const clampFrac = (v: number, max: number) => Math.max(0, Math.min(1, v / (max || 1)));
const asPct = (f: number) => `${Math.max(0, f) * 100}%`;

/**
 * Versatile horizontal track: a fill (that turns `overColor` past `ceiling`),
 * an optional striped projection, a ceiling tick and a "today" marker.
 * Covers both the forecast strip and the weekly-ceiling bars.
 *
 * Widths/positions are driven by `useTween`, so both the grow-from-zero on mount
 * and the ease-from-current on a value change are one JS animation (no CSS
 * transition that can silently fail to fire on an in-place update).
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
  gradient = false,
  animate = false,
  animationDelay = 0,
  overColor = "var(--neg)",
  trackColor = "var(--surface-hi)",
  className,
  ariaLabel,
}: ProgressTrackProps) => {
  const over = ceiling != null && value > ceiling;
  const budgetPart = over && ceiling != null ? ceiling : value;
  const hasProjection = projected != null && projected > value;

  const delayMs = animationDelay * 1000;
  // tween each fraction (0..1) toward its target; on remount all start at 0
  const fBudget = useTween(clampFrac(budgetPart, max), animate, 650, delayMs);
  const fValue = useTween(clampFrac(value, max), animate, 650, delayMs);
  const fProjected = useTween(clampFrac(projected ?? 0, max), animate, 650, delayMs);
  const fCeiling = useTween(clampFrac(ceiling ?? 0, max), animate, 650, delayMs);
  const fMarker = useTween(clampFrac(marker ?? 0, max), animate, 650, delayMs);

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
        {hasProjection && (
          <span
            className="absolute inset-y-0"
            style={{
              left: asPct(fValue),
              width: asPct(fProjected - fValue),
              background: "repeating-linear-gradient(45deg, transparent 0 6px, var(--accent-bg) 6px 12px)",
              borderLeft: "1px solid var(--accent-d)",
              borderRight: "1px dashed var(--accent-d)",
            }}
          />
        )}
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: asPct(fBudget),
            background: gradient ? "var(--bar-fill)" : color,
            opacity: gradient ? 0.45 : 0.92,
          }}
        />
        {over && ceiling != null && (
          <span
            className="absolute inset-y-0"
            style={{
              left: asPct(fCeiling),
              width: asPct(fValue - fCeiling),
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
            left: asPct(fCeiling),
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
            left: asPct(fMarker),
            top: -4,
            bottom: -4,
            width: 2,
            marginLeft: -1,
            background: "var(--ink)",
          }}
        >
          {markerLabel && (
            <span className="num absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface-elev px-1.5 py-px text-2xs text-ink">
              {markerLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default ProgressTrack;
