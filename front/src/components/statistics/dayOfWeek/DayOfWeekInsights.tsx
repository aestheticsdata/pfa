import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";

import type { WeekdayInsights, WeekdayStat } from "@components/statistics/interfaces/weekdayStatsTypes";
import type { ReactNode } from "react";

interface ChipProps {
  dot: string;
  children: ReactNode;
}

/** One header insight chip: a coloured dot + label. */
const Chip = ({ dot, children }: ChipProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-hi/60 px-2.5 py-1 text-2xs">
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: dot }}
    />
    {children}
  </span>
);

interface DayOfWeekInsightsProps {
  stats: WeekdayStat[];
  insights: WeekdayInsights;
}

/** The header chips: the dearest and the cheapest weekday, and the weekend against the week. */
const DayOfWeekInsights = ({ stats, insights }: DayOfWeekInsightsProps) => {
  const { euro0 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");
  const { peakDow, troughDow, weekendDeltaPct } = insights;
  if (peakDow == null) return null;

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-2 text-ink-4">
      <Chip dot="var(--neg)">
        {dayOfWeek.chips.peak}{" "}
        <span className="num text-neg">
          {dayOfWeek.chips.dayAmount(dayOfWeek.days[peakDow].toLowerCase(), euro0(stats[peakDow].avgAmount))}
        </span>
      </Chip>
      {troughDow != null && troughDow !== peakDow && (
        <Chip dot="var(--accent-strong)">
          {dayOfWeek.chips.trough}{" "}
          <span className="num text-accent-strong">
            {dayOfWeek.chips.dayAmount(dayOfWeek.days[troughDow].toLowerCase(), euro0(stats[troughDow].avgAmount))}
          </span>
        </Chip>
      )}
      {weekendDeltaPct != null && (
        <Chip dot="var(--ink-4)">
          {dayOfWeek.chips.weekend}{" "}
          <span className="num text-accent-strong">
            {weekendDeltaPct >= 0 ? "+" : "−"}
            {dayOfWeek.deltaPct(String(Math.abs(Math.round(weekendDeltaPct))))}
          </span>{" "}
          {dayOfWeek.chips.weekendVsWeek}
        </Chip>
      )}
    </div>
  );
};

export default DayOfWeekInsights;
