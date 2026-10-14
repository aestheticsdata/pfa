import { cx } from "@lib/classNames/cx";
import { hoverOver } from "@lib/dataviz/hoverIndex";

import type { PlotHover } from "@lib/dataviz/interfaces/dataVizTypes";

interface GradientColumnsProps {
  values: number[];
  /** Domain max; defaults to the tallest column. */
  max?: number;
  /** Tailwind gap classes; the height is the `chart-plot` utility, which the gradient spans. */
  className?: string;
  ariaLabel?: string;
  /** Makes every non-empty column a button (an empty one stays inert); called with its index. */
  onSelect?: (index: number) => void;
  /** The column under the pointer, or null when it leaves the plot (a tooltip, PFA-229). */
  onHover?: (hover: PlotHover | null) => void;
  /** The hovered column, lit like a hovered button. */
  active?: number | null;
}

/**
 * Columns cut from one gradient that spans the whole chart height (added for the back-office,
 * handoff v5): faint at the baseline, the accent at the top, so taller bars end brighter. Each
 * column shows its own slice — `background-size: 100% <chart height>`, anchored at the bottom.
 */
const GradientColumns = ({ values, max, className, ariaLabel, onSelect, onHover, active }: GradientColumnsProps) => {
  const domainMax = max ?? Math.max(1, ...values);
  return (
    // A figure either way: plain bars, or bars that are buttons (`onSelect`).
    <figure
      className={cx("chart-plot m-0 flex items-end border-b border-line", className)}
      aria-label={ariaLabel}
      onMouseMove={onHover && ((event) => onHover(hoverOver(event, values.length)))}
      onMouseLeave={onHover && (() => onHover(null))}
    >
      {values.map((value, index) => {
        const bar = (
          // biome-ignore lint/correctness/useJsxKeyInIterable: the column's only child below, not an item of the list
          <span
            className="bg-chart-slice block w-full rounded-t-xs"
            style={{ height: `${(Math.max(0, value) / domainMax) * 100}%` }}
          />
        );
        const lit = active === index && "bg-hover";
        return onSelect && value > 0 ? (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed window of time slices, positional by nature
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={cx(
              "flex h-full min-w-0 flex-1 cursor-pointer items-end rounded-t-xs hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
              lit,
            )}
          >
            {bar}
          </button>
        ) : (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed window of time slices, positional by nature
            key={index}
            className={cx("flex h-full min-w-0 flex-1 items-end rounded-t-xs", lit)}
          >
            {bar}
          </div>
        );
      })}
    </figure>
  );
};

export default GradientColumns;
