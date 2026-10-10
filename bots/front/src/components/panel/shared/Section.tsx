import { cx } from "@lib/classNames/cx";

import type { SectionProps } from "@components/panel/shared/interfaces/sharedTypes";

/** A card section (`.sec`), ruled from the one above. */
const Section = ({ children, className }: SectionProps) => (
  <div className={cx("border-t border-line-soft px-3.5 py-3", className)}>{children}</div>
);

export default Section;
