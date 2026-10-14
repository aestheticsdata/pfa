import { cx } from "@lib/classNames/cx";

import type { PlotHover, Segment } from "@lib/dataviz/interfaces/dataVizTypes";
import type { MouseEvent } from "react";

interface StackedBarProps {
  segments: Segment[];
  /** Tailwind height class of the bar. */
  className?: string;
  ariaLabel?: string;
  testId?: string;
  /** Faded segments (e.g. an action switched off), by label. */
  faded?: string[];
  /** Makes every segment a button; called with its index (PFA-229). */
  onSelect?: (index: number) => void;
  /** The segment under the pointer, or null when it leaves the bar (a tooltip, PFA-229). */
  onHover?: (hover: PlotHover | null) => void;
  /** The hovered segment: the others dim. */
  active?: number | null;
}

/** Single horizontal stacked bar (e.g. the action mix), with a 2px gap between segments. */
const StackedBar = ({
  segments,
  className,
  ariaLabel,
  testId,
  faded = [],
  onSelect,
  onHover,
  active,
}: StackedBarProps) => {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) || 1;
  return (
    // A figure either way, as StackedColumns: plain segments, or segments that are buttons (`onSelect`).
    <figure
      className={cx("m-0 flex w-full gap-0.5 overflow-hidden rounded-tag", className)}
      aria-label={ariaLabel}
      data-testid={testId}
      onMouseLeave={onHover && (() => onHover(null))}
    >
      {segments.map((seg, index) => {
        const props = {
          className: cx(
            "block h-full transition-opacity",
            seg.label && faded.includes(seg.label) && "opacity-35",
            active != null && active !== index && "opacity-50",
          ),
          style: { width: `${(Math.max(0, seg.value) / total) * 100}%`, background: seg.color },
          onMouseMove:
            onHover && ((event: MouseEvent<HTMLElement>) => onHover({ index, x: event.clientX, y: event.clientY })),
        };
        const key = `${seg.label ?? ""}-${seg.color}`;
        return onSelect ? (
          <button
            key={key}
            type="button"
            aria-label={seg.label}
            onClick={() => onSelect(index)}
            {...props}
            className={cx(
              props.className,
              "cursor-pointer border-0 p-0 focus-visible:outline-2 focus-visible:outline-text",
            )}
          />
        ) : (
          <span
            key={key}
            title={onHover ? undefined : seg.label}
            {...props}
          />
        );
      })}
    </figure>
  );
};

export default StackedBar;
