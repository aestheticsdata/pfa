import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface LegendItemProps {
  /** The colour swatch (solid dot, gradient, hatch…) rendered before the label. */
  swatch: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * One chart-legend entry: a swatch followed by its label. The swatch itself
 * stays per-site (fills vary — solid token, gradient, hatch); this only owns the
 * `inline-flex items-center gap-1.5` row.
 */
function LegendItem({ swatch, className, children }: LegendItemProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {swatch}
      {children}
    </span>
  );
}

export { LegendItem };
