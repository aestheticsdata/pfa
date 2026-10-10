import { cx } from "@lib/classNames/cx";

import type { NavCountProps } from "@components/panel/topBar/interfaces/topBarTypes";

/** The count beside a nav entry; the incidents one is a red pill. */
const NavCount = ({ item }: NavCountProps) =>
  item.count === null ? null : (
    <span
      className={cx(
        "font-mono text-tiny",
        item.alarm ? "rounded-full bg-bad px-1.5 font-semibold text-on-bad" : "text-dim",
      )}
    >
      {item.count}
    </span>
  );

export default NavCount;
