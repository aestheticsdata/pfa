import { cx } from "@lib/classNames/cx";

import type { StackedColumn } from "@lib/dataviz/interfaces/dataVizTypes";

interface StackedColumnsProps {
  columns: StackedColumn[];
  /** Domain max; defaults to the tallest column. */
  max?: number;
  /** Tailwind height and gap classes of the plot. */
  className?: string;
  ariaLabel?: string;
  /** A column's lowest part keeps rounded top corners (the handoff's bars); stacked parts above are square. */
  rounded?: boolean;
}

/**
 * Vertical stacked columns (added to the PFA lib for the back-office): actions over errors,
 * 2xx / 4xx / 5xx per slice. Flex boxes rather than SVG so a column's gap and minimum width stay
 * crisp at any width; parts are listed bottom first.
 */
const StackedColumns = ({ columns, max, className, ariaLabel, rounded = true }: StackedColumnsProps) => {
  const domainMax = max ?? Math.max(1, ...columns.map((column) => column.parts.reduce((s, p) => s + p.value, 0)));
  return (
    <div
      className={cx("flex items-end border-b border-line", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex h-full min-w-0 flex-1 flex-col-reverse"
        >
          {column.parts.map((part, index) => (
            <span
              key={`${column.key}-${part.label ?? index}`}
              className={cx("block", rounded && index === column.parts.length - 1 && "rounded-t-xs")}
              style={{ height: `${(Math.max(0, part.value) / domainMax) * 100}%`, background: part.color }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default StackedColumns;
