import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";

import type { ButtonProps } from "@components/ui/interfaces/uiTypes";

const VARIANTS = {
  [BUTTON_VARIANT.default]: "border-line bg-panel hover:border-faint",
  [BUTTON_VARIANT.ghost]: "border-line bg-transparent text-muted hover:border-faint hover:text-text",
  [BUTTON_VARIANT.primary]: "border-ok bg-ok font-semibold text-on-ok hover:brightness-106",
  [BUTTON_VARIANT.danger]: "border-bad bg-bad font-semibold text-on-bad hover:brightness-106",
  [BUTTON_VARIANT.dangerOutline]: "border-bad/50 bg-transparent text-bad",
};

/** Touch-sized (40px) on phones, compact from the tablet up. */
const SIZES = {
  [BUTTON_SIZE.md]: "h-10 px-3 text-body tablet:h-8",
  [BUTTON_SIZE.sm]: "h-10 px-3 text-body tablet:h-7 tablet:px-2.5 tablet:text-xs",
  [BUTTON_SIZE.icon]: "size-10 justify-center px-0 text-body tablet:size-8",
};

/** The handoff's `.btn`, in its five variants. */
const Button = ({ variant = BUTTON_VARIANT.default, size = BUTTON_SIZE.md, className, ...props }: ButtonProps) => (
  <button
    type="button"
    {...props}
    className={cx(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-ctl border font-medium transition-colors duration-150 disabled:cursor-default disabled:opacity-40",
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
  />
);

export default Button;
