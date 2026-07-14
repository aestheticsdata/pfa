import { splitAmount } from "@lib/format";
import { cn } from "@lib/utils";

interface MoneyAmountProps {
  value: number;
  /** Trailing unit inside the de-emphasised span. */
  unit?: string;
  /** Classes for the de-emphasised ",decimals unit" span (usually a smaller size). */
  decimalClassName?: string;
  /** Classes for the whole figure (main size / colour / `num`). */
  className?: string;
}

/**
 * Money figure rendered as `{integer}` + a de-emphasised `,decimals unit` span —
 * the one place that split lives. Set the main size/colour via `className` (or an
 * ancestor); the decimals are toned down (`font-normal text-ink-3`) and sized via
 * `decimalClassName`.
 */
function MoneyAmount({ value, unit = " €", decimalClassName, className }: MoneyAmountProps) {
  const { int, dec } = splitAmount(value);
  return (
    <span className={className}>
      {int}
      <span className={cn("font-normal text-ink-3", decimalClassName)}>
        ,{dec}
        {unit}
      </span>
    </span>
  );
}

export { MoneyAmount };
