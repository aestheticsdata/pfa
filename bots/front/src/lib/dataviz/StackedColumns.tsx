import { cx } from "@lib/classNames/cx";
import { hoverOver } from "@lib/dataviz/hoverIndex";

import type { PlotHover, StackedColumn } from "@lib/dataviz/interfaces/dataVizTypes";

interface StackedColumnsProps {
  columns: StackedColumn[];
  /** Domain max; defaults to the tallest column. */
  max?: number;
  /** Tailwind height and gap classes of the plot. */
  className?: string;
  ariaLabel?: string;
  /** A column's lowest part keeps rounded top corners (the handoff's bars); stacked parts above are square. */
  rounded?: boolean;
  /** Makes every non-empty column a button (an empty one stays inert); called with its index. */
  onSelect?: (index: number) => void;
  /** The column under the pointer, or null when it leaves the plot (a tooltip, PFA-229). */
  onHover?: (hover: PlotHover | null) => void;
  /** The hovered column, lit like a hovered button. */
  active?: number | null;
}

/**
 * Vertical stacked columns (added to the PFA lib for the back-office): actions over errors,
 * 2xx / 4xx / 5xx per slice. Flex boxes rather than SVG so a column's gap and minimum width stay
 * crisp at any width; parts are listed bottom first.
 */
const StackedColumns = ({
  columns,
  max,
  className,
  ariaLabel,
  rounded = true,
  onSelect,
  onHover,
  active,
}: StackedColumnsProps) => {
  const totals = columns.map((column) => column.parts.reduce((sum, part) => sum + Math.max(0, part.value), 0));
  const domainMax = max ?? Math.max(1, ...totals);
  return (
    // A figure either way: plain bars, or bars that are buttons (`onSelect`).
    <figure
      className={cx("m-0 flex items-end border-b border-line", className)}
      aria-label={ariaLabel}
      onMouseMove={onHover && ((event) => onHover(hoverOver(event, columns.length)))}
      onMouseLeave={onHover && (() => onHover(null))}
    >
      {columns.map((column, index) => {
        const parts = column.parts.map((part, partIndex) => (
          <span
            key={`${column.key}-${part.label ?? partIndex}`}
            className={cx("block", rounded && partIndex === column.parts.length - 1 && "rounded-t-xs")}
            style={{ height: `${(Math.max(0, part.value) / domainMax) * 100}%`, background: part.color }}
          />
        ));
        return onSelect && (totals[index] ?? 0) > 0 ? (
          <button
            key={column.key}
            type="button"
            aria-label={column.label}
            onClick={() => onSelect(index)}
            className={cx(
              "flex h-full min-w-0 flex-1 cursor-pointer flex-col-reverse rounded-t-xs hover:bg-hover focus-visible:bg-hover focus-visible:outline-none [&>span]:transition-opacity hover:[&>span]:opacity-80",
              active === index && "bg-hover",
            )}
          >
            {parts}
          </button>
        ) : (
          <div
            key={column.key}
            className={cx("flex h-full min-w-0 flex-1 flex-col-reverse rounded-t-xs", active === index && "bg-hover")}
          >
            {parts}
          </div>
        );
      })}
    </figure>
  );
};

export default StackedColumns;
