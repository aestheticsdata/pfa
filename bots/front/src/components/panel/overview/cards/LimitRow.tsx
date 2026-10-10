import { cx } from "@lib/classNames/cx";

import type { LimitRowProps } from "@components/panel/overview/interfaces/limitTypes";

/** One hard limit: name, value, where it comes from, and a thin usage bar. */
const LimitRow = ({ label, value, keyLine, share, warn = false }: LimitRowProps) => (
  <div className="grid grid-cols-(--grid-limit) items-baseline gap-x-3 gap-y-1 border-t border-line-soft px-3.5 py-2.25 first:border-t-0">
    <span>{label}</span>
    <span className="font-mono text-title font-semibold">{value}</span>
    <span className="col-span-full font-mono text-xs text-dim">{keyLine}</span>
    <div className="relative col-span-full mt-1.5 h-1 overflow-hidden rounded-xs bg-bg">
      <span
        className={cx("absolute inset-y-0 left-0 rounded-xs", warn ? "bg-warn" : "bg-muted")}
        style={{ width: `${Math.min(100, share * 100)}%` }}
      />
    </div>
  </div>
);

export default LimitRow;
