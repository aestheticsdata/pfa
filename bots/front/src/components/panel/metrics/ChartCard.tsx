import Card from "@components/ui/Card";
import { cx } from "@lib/classNames/cx";

import type { ChartCardProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** A Metrics card: title + legend, the chart, its time axis. */
const ChartCard = ({ title, legend, sub, axis, children, className }: ChartCardProps) => (
  <Card className={className}>
    <header className="flex flex-wrap items-baseline gap-2.5 px-3.5 pt-3">
      <h2 className="m-0 shrink-0 text-sm font-medium tracking-title">{title}</h2>
      <span className="flex-1" />
      {sub && <span className="whitespace-nowrap font-mono text-xs text-dim">{sub}</span>}
      {legend && <span className="ml-auto flex shrink-0 flex-wrap gap-3.5 font-mono text-xs text-dim">{legend}</span>}
    </header>
    <div className="px-3.5 pt-2.5 pb-3.5">
      {children}
      {axis.length > 0 && (
        <div className={cx("mt-1.5 flex justify-between font-mono text-tiny text-dim")}>
          {axis.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      )}
    </div>
  </Card>
);

export default ChartCard;
