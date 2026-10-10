import Label from "@components/ui/Label";
import { cx } from "@lib/classNames/cx";

import type { StatTileProps } from "@components/panel/overview/interfaces/overviewTypes";

/** One status tile: label, big mono figure, mono sub-line. */
const StatTile = ({ label, value, sub, valueClass }: StatTileProps) => (
  <div className="border-line-soft px-3.5 py-3 [&:nth-child(2n)]:border-l [&:nth-child(n+3)]:border-t tablet:[&:nth-child(n+2)]:border-l tablet:[&:nth-child(n+3)]:border-t-0">
    <Label className="flex items-center gap-1.5">{label}</Label>
    <div className={cx("mt-1.5 font-mono text-stat font-semibold tracking-figure tabular", valueClass)}>{value}</div>
    <div className="mt-0.75 font-mono text-xs text-dim">{sub}</div>
  </div>
);

export default StatTile;
