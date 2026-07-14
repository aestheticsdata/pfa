import { Overline } from "@components/shared/Overline";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** Container classes (e.g. `bg-card px-5 py-4`, alignment). */
  className?: string;
  /** Value-line classes; overrides the default large-stat ramp. */
  valueClassName?: string;
  /** Caption classes. */
  subClassName?: string;
}

/**
 * Label + value + caption stat tile: an `Overline` eyebrow, a large numeric value
 * slot (compose `<MoneyAmount>` or `<AnimatedNumber>` inside), and a muted
 * sub-caption. Layout specifics (surface, alignment) go through `className`.
 */
function StatTile({ label, value, sub, className, valueClassName, subClassName }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Overline>{label}</Overline>
      <div className={cn("num text-2xl font-medium leading-none tracking-tight text-ink", valueClassName)}>{value}</div>
      {sub != null && <div className={cn("text-xs text-ink-3", subClassName)}>{sub}</div>}
    </div>
  );
}

export { StatTile };
