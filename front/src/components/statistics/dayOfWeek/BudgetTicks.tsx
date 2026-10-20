import BandSpacer from "@components/statistics/dayOfWeek/BandSpacer";
import { BAND_GRID } from "@components/statistics/dayOfWeek/constants";
import useFormat from "@i18n/useFormat";

import type { DayOfWeekScale } from "@components/statistics/interfaces/dayOfWeekTypes";

interface BudgetTickProps {
  frac: number;
  label: string;
  /** The breakpoint at which the tick shows, so the two never crowd each other. */
  display: string;
}

/** A budget threshold tick + its amount, under the bar column. */
const BudgetTick = ({ frac, label, display }: BudgetTickProps) => (
  <div
    className={`absolute top-0 -translate-x-1/2 flex-col items-center ${display}`}
    style={{ left: `${frac * 100}%` }}
  >
    <span className="h-1.5 w-px bg-ink-4" />
    <span className="num mt-1 whitespace-nowrap text-2xs text-ink-4">{label}</span>
  </div>
);

/**
 * Budget thresholds as small ticks beneath the bar column. Stacked rows put the
 * two close enough to overlap on a narrow screen, so only the danger threshold
 * is kept below `md` — the legend spells out both amounts either way.
 */
const BudgetTicks = ({ budgetFrac, dangerFrac, dayBudget, dangerBudget }: DayOfWeekScale) => {
  const { euro0 } = useFormat();
  if (budgetFrac == null || dangerFrac == null || dayBudget == null || dangerBudget == null) return null;

  return (
    <div className={`${BAND_GRID} mt-2`}>
      <BandSpacer />
      <div className="relative h-5">
        <BudgetTick
          frac={budgetFrac}
          label={`${euro0(dayBudget)} €`}
          display="hidden md:flex"
        />
        <BudgetTick
          frac={dangerFrac}
          label={`${euro0(dangerBudget)} €`}
          display="flex"
        />
      </div>
      <BandSpacer />
    </div>
  );
};

export default BudgetTicks;
