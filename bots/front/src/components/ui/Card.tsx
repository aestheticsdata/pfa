import { cx } from "@lib/classNames/cx";

import type { CardProps } from "@components/ui/interfaces/uiTypes";

const Card = ({ children, className, testId }: CardProps) => (
  <section
    data-testid={testId}
    className={cx("min-w-0 rounded-card border border-line-soft bg-panel", className)}
  >
    {children}
  </section>
);

export default Card;
