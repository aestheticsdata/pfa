import { cx } from "@lib/classNames/cx";

interface GradientColumnsProps {
  values: number[];
  /** Domain max; defaults to the tallest column. */
  max?: number;
  /** Tailwind gap classes; the height is the `chart-plot` utility, which the gradient spans. */
  className?: string;
  ariaLabel?: string;
}

/**
 * Columns cut from one gradient that spans the whole chart height (added for the back-office,
 * handoff v5): faint at the baseline, the accent at the top, so taller bars end brighter. Each
 * column shows its own slice — `background-size: 100% <chart height>`, anchored at the bottom.
 */
const GradientColumns = ({ values, max, className, ariaLabel }: GradientColumnsProps) => {
  const domainMax = max ?? Math.max(1, ...values);
  return (
    <div
      className={cx("chart-plot flex items-end border-b border-line", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {values.map((value, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed window of time slices, positional by nature
          key={index}
          className="bg-chart-slice block min-w-0 flex-1 rounded-t-xs"
          style={{ height: `${(Math.max(0, value) / domainMax) * 100}%` }}
        />
      ))}
    </div>
  );
};

export default GradientColumns;
