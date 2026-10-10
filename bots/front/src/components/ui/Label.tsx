import { cx } from "@lib/classNames/cx";

import type { LabelProps } from "@components/ui/interfaces/uiTypes";

/** The small uppercase label (`.k`). */
const Label = ({ children, className }: LabelProps) => (
  <span className={cx("text-tiny font-medium uppercase tracking-label text-dim", className)}>{children}</span>
);

export default Label;
