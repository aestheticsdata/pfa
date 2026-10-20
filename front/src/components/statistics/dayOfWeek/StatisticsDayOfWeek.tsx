"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import BandSpacer from "@components/statistics/dayOfWeek/BandSpacer";
import BudgetTicks from "@components/statistics/dayOfWeek/BudgetTicks";
import { BAND_GRID } from "@components/statistics/dayOfWeek/constants";
import DayOfWeekInsights from "@components/statistics/dayOfWeek/DayOfWeekInsights";
import DayOfWeekLegend from "@components/statistics/dayOfWeek/DayOfWeekLegend";
import DayOfWeekRow from "@components/statistics/dayOfWeek/DayOfWeekRow";
import DayOfWeekTooltipContent from "@components/statistics/dayOfWeek/DayOfWeekTooltipContent";
import { dayOfWeekScale } from "@components/statistics/dayOfWeek/helpers/dayOfWeekScale";
import useCompareBarsCollapsed from "@components/statistics/dayOfWeek/hooks/useCompareBarsCollapsed";
import PlotGuides from "@components/statistics/dayOfWeek/PlotGuides";
import { overallDailyAverage, weekdayAverages, weekdayInsights } from "@components/statistics/helpers/weekdayStats";
import { Tooltip } from "@components/ui/tooltip";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { useCursorHover } from "@lib/dataviz";

import type { DailyStat, WeekdayCategory } from "@src/schemas/stats";

interface StatisticsDayOfWeekProps {
  year: number;
  now: Date;
  /** Per-day spending totals for the year (COS-45); `undefined` while the request is in flight. */
  days: DailyStat[] | undefined;
  /** Compare-year daily totals; `undefined` when "Compare to" is off (COS-127). */
  compareDays?: DailyStat[];
  /** The year being compared against, shown on each compare row + the legend. */
  compareYear: number;
  /** Whether year comparison is active — gates the compare-year legend item. */
  compareEnabled: boolean;
  /** Dominant category per weekday (index 0 = Monday), for the tooltip; `undefined` while loading. */
  weekdayCategories?: (WeekdayCategory | null)[];
  /** Weekly ceiling (real data) — its per-day share drives the colour zones. */
  weeklyCeiling: number | null;
}

/** "Spendings by day of the week" — real weekday spending rhythm (COS-48, COS-132, COS-127). */
const StatisticsDayOfWeek = ({
  year,
  now,
  days,
  compareDays,
  compareYear,
  compareEnabled,
  weekdayCategories,
  weeklyCeiling,
}: StatisticsDayOfWeekProps) => {
  const { euro, euro0, pct1 } = useFormat();
  const { dayOfWeek } = useTranslations("statistics");
  const common = useTranslations("common");
  const rowTip = useCursorHover<number>();

  // Compare-year marks: `hasCompareData` (the compared year has spending, and the
  // fetch keeps it cached even when the toggle is off) reserves their layout space,
  // so toggling "Compare to" only fades them in/out and the widget keeps its height.
  // `showCompare` (fade state) additionally requires the toggle to be on.
  const compareStats = compareDays ? weekdayAverages(compareDays, compareYear, now) : null;
  const hasCompareData = compareStats?.some((s) => s.avgAmount > 0) ?? false;
  const showCompare = compareEnabled && hasCompareData;
  const barsCollapsed = useCompareBarsCollapsed(showCompare);

  if (days === undefined) {
    return (
      <GlowCard
        as="section"
        className="px-6 py-5.5"
      >
        <CardSectionHeader
          title={dayOfWeek.title}
          meta={dayOfWeek.meta(year)}
        />
        <div className="grid place-items-center py-10 text-sm text-ink-4">{common.loading}</div>
      </GlowCard>
    );
  }

  const stats = weekdayAverages(days, year, now);
  const overall = overallDailyAverage(days, year, now);
  const insights = weekdayInsights(stats);
  const scale = dayOfWeekScale({ stats, compareStats, overallAvg: overall.avgAmount, weeklyCeiling });
  const { dayBudget, dangerBudget, budgetFrac, dangerFrac, avgFrac, avgLabelAlign } = scale;
  const hoveredDow = rowTip.hover?.data;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <CardSectionHeader
        title={dayOfWeek.title}
        meta={
          <>
            <span className="font-semibold text-ink">{year}</span>{" "}
            {dayOfWeek.subtitle(pct1(overall.avgTx), euro(overall.avgAmount))}
          </>
        }
      />

      <DayOfWeekInsights
        stats={stats}
        insights={insights}
      />

      {/* average reference-line label, positioned over the bar column at its fraction. */}
      <div className={`${BAND_GRID} mt-4`}>
        <BandSpacer />
        <div className="relative h-4">
          <span
            className={`num absolute top-0 whitespace-nowrap text-2xs text-accent-strong ${avgLabelAlign}`}
            style={{ left: `${avgFrac * 100}%` }}
          >
            {dayOfWeek.averageLine(euro0(overall.avgAmount))}
          </span>
        </div>
        <BandSpacer />
      </div>

      <div className="relative mt-1">
        {/* One delegated hover handler on the plot resolves the row by its
            data-dow attribute (like the heatmap), so the tooltip follows the
            cursor across the rows without making each row separately interactive. */}
        <div
          data-testid="weekday-plot"
          className="flex flex-col gap-4 md:gap-2"
          role="img"
          aria-label={dayOfWeek.title}
          onMouseMove={(e) => {
            const row = (e.target as HTMLElement).closest<HTMLElement>("[data-dow]");
            if (row?.dataset.dow) {
              rowTip.show(e.clientX, e.clientY, Number(row.dataset.dow));
            }
          }}
          onMouseLeave={rowTip.clear}
        >
          {stats.map((s, dow) => (
            <DayOfWeekRow
              key={dayOfWeek.days[dow]}
              dow={dow}
              stat={s}
              // Cached even when the toggle is off, so the compare marks can animate out.
              compareStat={compareStats?.[dow] ?? null}
              compareYear={compareYear}
              scale={scale}
              hasCompareData={hasCompareData}
              showCompare={showCompare}
              barsCollapsed={barsCollapsed}
              isPeak={dow === insights.peakDow}
              isTrough={dow === insights.troughDow}
            />
          ))}
        </div>

        <PlotGuides
          budgetFrac={budgetFrac}
          dangerFrac={dangerFrac}
          avgFrac={avgFrac}
        />
      </div>

      <BudgetTicks {...scale} />

      <DayOfWeekLegend
        dayBudget={dayBudget}
        dangerBudget={dangerBudget}
        compareYear={compareYear}
        hasCompareData={hasCompareData}
        showCompare={showCompare}
      />

      <Tooltip
        mode="cursor"
        point={rowTip.hover}
        maxWidth={270}
      >
        {hoveredDow != null && (
          <DayOfWeekTooltipContent
            dow={hoveredDow}
            stat={stats[hoveredDow]}
            compareStat={showCompare && compareStats ? compareStats[hoveredDow] : null}
            compareYear={compareYear}
            dayBudget={dayBudget}
            category={weekdayCategories?.[hoveredDow]}
          />
        )}
      </Tooltip>
    </GlowCard>
  );
};

export default StatisticsDayOfWeek;
