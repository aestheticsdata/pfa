import { cn } from "@lib/utils";
import { cva } from "class-variance-authority";

import type { VariantProps } from "class-variance-authority";

/**
 * Square icon-only action button — the single primitive behind every hand-rolled
 * `grid size-N place-items-center rounded …` button scattered across the app
 * (and the twin `.ic` / `.exc-ic` CSS classes it replaced).
 *
 * - `variant` sets the resting/hover chrome.
 * - `size` sets the box, its corner radius and the child icon size in one step,
 *   so call sites never restyle the `<svg>` child.
 *
 * The `danger` variant reuses the COS-82 danger tokens for its hover state. Pass
 * `className` for the rare intentional deviation (e.g. an "active" accent state);
 * it is merged last so it wins.
 */
const iconButtonVariants = cva(
  "grid shrink-0 cursor-pointer place-items-center border transition-colors [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "border-transparent text-ink-4 hover:bg-surface-hi hover:text-ink",
        bordered: "border-line bg-surface-hi text-ink-3 hover:text-ink",
        danger:
          "border-line bg-surface-hi text-ink-3 hover:border-danger-border-soft hover:bg-danger-surface hover:text-neg",
      },
      size: {
        5: "size-5 rounded-sm [&_svg]:size-4",
        6: "size-6 rounded-sm [&_svg]:size-3.5",
        7: "size-7 rounded-sm [&_svg]:size-3.5",
        8: "size-8 rounded-lg [&_svg]:size-4",
        9: "size-9 rounded-lg [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "bordered",
      size: 6,
    },
  },
);

function IconButton({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof iconButtonVariants>) {
  return (
    <button
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { IconButton, iconButtonVariants };
