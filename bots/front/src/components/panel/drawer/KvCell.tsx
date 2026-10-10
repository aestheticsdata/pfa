import Label from "@components/ui/Label";
import { cx } from "@lib/classNames/cx";

import type { KvCellProps } from "@components/panel/drawer/interfaces/drawerTypes";

/**
 * One cell of the drawer's figures: 2 columns on a phone, 3 from 700px — the inner rules follow
 * the column count, so no cell is ever ruled on its outer edge.
 */
const KvCell = ({ label, value, valueClass }: KvCellProps) => (
  <div className="border-line-soft px-3.5 py-2.5 [&:nth-child(2n)]:border-l [&:nth-child(n+3)]:border-t tablet:[&:nth-child(2n)]:border-l-0 tablet:[&:nth-child(3n+2)]:border-l tablet:[&:nth-child(3n)]:border-l tablet:[&:nth-child(n+3)]:border-t-0 tablet:[&:nth-child(n+4)]:border-t">
    <Label>{label}</Label>
    <div
      className={cx("mt-0.75 font-mono text-base font-semibold", valueClass)}
      suppressHydrationWarning
    >
      {value}
    </div>
  </div>
);

export default KvCell;
