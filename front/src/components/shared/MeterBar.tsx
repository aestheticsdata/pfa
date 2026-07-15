import { cn } from "@lib/utils";

interface MeterBarProps {
  /** Fill width as a 0–100 percentage. */
  value: number;
  /** CSS background of the fill; defaults to the accent `--bar-fill` gradient. */
  fill?: string;
  /** Track height in px. */
  height: number;
  /** Fill opacity (the bars sit slightly translucent over the track). */
  opacity?: number;
  /** Extra classes for the track. */
  className?: string;
}

/**
 * Horizontal meter/progress bar: a rounded `bg-surface-hi` track with a
 * percentage-width fill. Single-fill only — multi-segment bars stay bespoke.
 */
function MeterBar({ value, fill = "var(--bar-fill)", height, opacity = 1, className }: MeterBarProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-sm bg-surface-hi", className)}
      style={{ height }}
    >
      <span
        className="block h-full rounded-sm"
        style={{ width: `${value}%`, background: fill, opacity }}
      />
    </div>
  );
}

export { MeterBar };
