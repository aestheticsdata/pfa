import { cx } from "@lib/classNames/cx";

import type { TooltipBodyProps } from "@components/ui/interfaces/uiTypes";

/**
 * Every chart tooltip's content (PFA-229): a title, the slot it covers, then one line per figure —
 * swatch, label, value on the right — and an optional hint. The bubble belongs to the tooltip.
 */
const TooltipBody = ({ title, sub, rows, hint }: TooltipBodyProps) => (
  <div className="min-w-40">
    <div className="font-sans text-note font-medium">{title}</div>
    {sub && <div className="mt-0.5 text-tiny text-dim">{sub}</div>}
    <dl className="m-0 mt-2 grid grid-cols-(--grid-tooltip) items-center gap-x-2 gap-y-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="contents"
        >
          <i
            className="block size-2 rounded-xs"
            style={{ background: row.color ?? "transparent" }}
          />
          <dt className="truncate text-muted">{row.label}</dt>
          <dd className={cx("m-0 text-right", row.bad && "text-bad")}>{row.value}</dd>
        </div>
      ))}
    </dl>
    {hint && <div className="mt-2 border-t border-line-soft pt-1.5 text-tiny text-dim">{hint}</div>}
  </div>
);

export default TooltipBody;
