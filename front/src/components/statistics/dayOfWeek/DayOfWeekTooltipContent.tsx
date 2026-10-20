import overspendLevel, { overspendTextClass } from "@components/spendings/helpers/overspendLevel";
import { deltaPct } from "@components/statistics/dayOfWeek/helpers/dayOfWeekScale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";

import type { WeekdayStat } from "@components/statistics/interfaces/weekdayStatsTypes";
import type { WeekdayCategory } from "@src/schemas/stats";
import type { ReactNode } from "react";

interface DeltaBadgeProps {
  pct: number;
}

/** Year-over-year delta coloured by direction: spending up = worse (red), down = better (green). */
const DeltaBadge = ({ pct }: DeltaBadgeProps) => {
  const { dayOfWeek } = useTranslations("statistics");

  const up = pct >= 0;
  return (
    <span className={up ? "text-neg" : "text-accent-strong"}>
      {up ? "↑" : "↓"} {dayOfWeek.deltaPct(String(Math.abs(Math.round(pct))))}
    </span>
  );
};

interface TipRowProps {
  label: string;
  value: ReactNode;
}

/** One label/value line in the hover tooltip. */
const TipRow = ({ label, value }: TipRowProps) => (
  <div className="flex items-baseline justify-between gap-6">
    <span className="text-ink-4">{label}</span>
    <span className="text-ink-2">{value}</span>
  </div>
);

interface DayOfWeekTooltipContentProps {
  dow: number;
  stat: WeekdayStat;
  /** The compared year's stat, only while the comparison is shown. */
  compareStat: WeekdayStat | null;
  compareYear: number;
  dayBudget: number | null;
  category: WeekdayCategory | null | undefined;
}

/** The hovered weekday in detail: ranges, frequency, dominant category and the compared year. */
const DayOfWeekTooltipContent = ({
  dow,
  stat: s,
  compareStat: cs,
  compareYear,
  dayBudget,
  category,
}: DayOfWeekTooltipContentProps) => {
  const { euro, euro0, pct1 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");
  const level = overspendLevel(s.avgAmount, dayBudget);
  const compareDelta = cs ? deltaPct(s.avgAmount, cs.avgAmount) : null;

  return (
    <div className="min-w-45">
      <div className="flex items-baseline justify-between gap-6 border-b border-line pb-1.5">
        <span className="font-medium text-ink">{dayOfWeek.days[dow]}</span>
        <span className={`num font-semibold ${overspendTextClass(level)}`}>{euro(s.avgAmount)} €</span>
      </div>
      <div className="mt-1.5 flex flex-col gap-0.5">
        <TipRow
          label={dayOfWeek.tooltip.typicalRange}
          value={
            <span className="num whitespace-nowrap">{dayOfWeek.tooltip.rangeValue(euro0(s.p10), euro0(s.p90))}</span>
          }
        />
        <TipRow
          label={dayOfWeek.tooltip.extremes}
          value={
            <span className="num whitespace-nowrap">{dayOfWeek.tooltip.rangeValue(euro0(s.min), euro0(s.max))}</span>
          }
        />
        <TipRow
          label={dayOfWeek.tooltip.txPerDay}
          value={<span className="num">{pct1(s.avgTx)}</span>}
        />
        <TipRow
          label={dayOfWeek.tooltip.dominantCategory}
          value={category?.name ?? dayOfWeek.tooltip.none}
        />
      </div>
      {cs && (
        <div className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
          <TipRow
            label={String(compareYear)}
            value={
              <span className="num text-accent-d">
                {dayOfWeek.tooltip.compareValue(euro(cs.avgAmount), pct1(cs.avgTx))}
              </span>
            }
          />
          {compareDelta != null && (
            <TipRow
              label={dayOfWeek.tooltip.compareDelta}
              value={
                <span className="num">
                  <DeltaBadge pct={compareDelta} />
                </span>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DayOfWeekTooltipContent;
