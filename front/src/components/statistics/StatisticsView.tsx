"use client";

import useExceptionals from "@components/exceptionals/services/useExceptionals";
import useDashboard from "@components/spendings/services/useDashboard";
import useReccurings from "@components/spendings/services/useReccurings";
import { exceptionalMonthly } from "@components/statistics/helpers/exceptionalsData";
import { projectedCurrentMonthRemainder, toYearMonthly } from "@components/statistics/helpers/projection";
import {
  categoryMonthly,
  elapsedMonths,
  monthlyTotals,
  perCategoryTotals,
} from "@components/statistics/helpers/statisticsData";
import StatisticsCategoryChart from "@components/statistics/StatisticsCategoryChart";
import StatisticsDayOfWeek from "@components/statistics/StatisticsDayOfWeek";
import StatisticsFilters from "@components/statistics/StatisticsFilters";
import StatisticsFixedExpenses from "@components/statistics/StatisticsFixedExpenses";
import StatisticsForecast from "@components/statistics/StatisticsForecast";
import StatisticsHeatmap from "@components/statistics/StatisticsHeatmap";
import StatisticsKpis from "@components/statistics/StatisticsKpis";
import StatisticsMonthlyChart from "@components/statistics/StatisticsMonthlyChart";
import StatisticsSearchTimeline from "@components/statistics/StatisticsSearchTimeline";
import StatisticsTopCategories from "@components/statistics/StatisticsTopCategories";
import useBiggestRegularExpense from "@components/statistics/services/useBiggestRegularExpense";
import useDailyStats from "@components/statistics/services/useDailyStats";
import useMonthlyIncome from "@components/statistics/services/useMonthlyIncome";
import useRecurringsDrawn from "@components/statistics/services/useRecurringsDrawn";
import useStatistics from "@components/statistics/services/useStatistics";
import useWeekdayCategories from "@components/statistics/services/useWeekdayCategories";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CategorySeries } from "@components/statistics/interfaces/statisticsCategoryChartTypes";
import type { TopCategoryRow } from "@components/statistics/interfaces/statisticsTopCategoriesTypes";

const MAX_CATEGORIES = 3;

const yearOptions = (currentYear: number): number[] => Array.from({ length: 7 }, (_, i) => currentYear - i);

/**
 * Statistics (/statistics) — redesigned on the custom dataviz lib (Phase 6).
 * A single /statistics fetch (all categories, the selected + compare years)
 * feeds the KPIs, forecast and charts; /exceptionals adds the exceptional layer.
 */
const StatisticsView = () => {
  const [now] = useState(() => new Date());
  const currentYear = now.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [compareYear, setCompareYear] = useState(currentYear - 1);
  const [showExceptionals, setShowExceptionals] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // The current-year forecast projects the rest of the year from history, so it
  // needs N-1 and N-2 alongside the selected + compare years (COS-47). N-1 is
  // usually already the compare year; N-2 is the extra fetch. Only added when the
  // current year is in view — past years are complete and never projected.
  const years = useMemo(() => {
    const requested = [selectedYear, compareYear];
    if (selectedYear === currentYear) requested.push(selectedYear - 1, selectedYear - 2);
    return Array.from(new Set(requested));
  }, [selectedYear, compareYear, currentYear]);

  const { statistics, categories, isLoading: statisticsLoading } = useStatistics({ years });
  const { dailyStats } = useDailyStats({ year: selectedYear });
  // Compare-year daily series for the day-of-week widget (COS-127) — only fetched
  // when "Compare to" is on.
  const { dailyStats: compareDailyStats } = useDailyStats({
    year: compareYear,
    enabled: compareEnabled,
    keepPreviousData: true,
  });
  // Dominant category per weekday, for that widget's hover tooltip (COS-127).
  const { weekdayCategories } = useWeekdayCategories({ year: selectedYear });
  const { biggestRegular, isLoading: biggestRegularLoading } = useBiggestRegularExpense({ year: selectedYear });
  const { exceptionals, isLoading: exceptionalsLoading } = useExceptionals({ year: selectedYear });
  const { exceptionals: compareExceptionals, isLoading: compareExceptionalsLoading } = useExceptionals({
    year: compareYear,
  });
  const dashboard = useDashboard();
  const { recurrings } = useReccurings();
  const { monthlyIncome } = useMonthlyIncome({ year: selectedYear });
  // "Already debited" is always the real current-year-to-date sum, independent of the
  // selected stats year — the widget's per-line breakdown stays on the current month.
  const { drawn } = useRecurringsDrawn({ year: currentYear, month: now.getMonth() });

  const data = statistics?.data;
  const colors = statistics?.colors ?? {};
  const regularMonthly = monthlyTotals(data, selectedYear);
  const excMonthly = exceptionalMonthly(exceptionals);
  const compareMonthly = monthlyTotals(data, compareYear);
  // Real end-of-month projection for the in-progress month (COS-50): its regular
  // remainder estimated from history (chain N-1 → N-2 → M-1), null at the very
  // first month of data. Only the current year is projected — past years are
  // complete. The chart adds the realized total (exceptionals not extrapolated).
  const projectedRemainder =
    selectedYear === currentYear
      ? projectedCurrentMonthRemainder(
          toYearMonthly(data, selectedYear),
          toYearMonthly(data, selectedYear - 1),
          toYearMonthly(data, selectedYear - 2),
          now,
        )
      : null;

  const prevTotals = perCategoryTotals(data, colors, compareYear);
  const prevByName = new Map(prevTotals.map((c) => [c.name, c.value]));
  const topCategoryRows: TopCategoryRow[] = perCategoryTotals(data, colors, selectedYear)
    .slice(0, 8)
    .map((c) => {
      const prev = prevByName.get(c.name) ?? 0;
      return {
        name: c.name,
        color: c.color,
        value: c.value,
        deltaPct: prev > 0 ? ((c.value - prev) / prev) * 100 : null,
        compareValue: prev,
      };
    });

  // The compare year is already part of the /statistics fetch, so the per-category
  // compare series costs no extra request (PFA-162).
  const categorySeries: CategorySeries[] = selectedCategoryIds
    .map((id) => categories.find((c) => c.ID === id))
    .filter((c): c is (typeof categories)[number] => Boolean(c))
    .map((category) => ({
      name: category.name,
      color: statistics?.colors?.[category.name] ?? category.color,
      monthly: categoryMonthly(data, selectedYear, category.name),
      compareMonthly: categoryMonthly(data, compareYear, category.name),
    }));
  const monthsCount = elapsedMonths(selectedYear, now);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setCompareYear(year - 1);
  };

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < MAX_CATEGORIES ? [...prev, id] : prev,
    );

  // The category chart only exists once a category is picked, two screens below
  // the (sticky) filter bar it is picked from — so nothing seems to happen. Bring
  // it into view on the 0 → 1 transition only: the 2nd and 3rd category land in an
  // already-visible widget, and yanking the page then would be hostile (PFA-162).
  const categoryCardRef = useRef<HTMLDivElement>(null);
  const previousCategoryCount = useRef(0);
  useEffect(() => {
    const count = selectedCategoryIds.length;
    const appeared = previousCategoryCount.current === 0 && count === 1;
    previousCategoryCount.current = count;
    if (!appeared) return;
    const reduce = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    categoryCardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [selectedCategoryIds]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar as its own bordered sticky card. Spendings uses a full-bleed
          sticky band (it needs the gutter bleed for the timeline cards'
          rings/glows); Stats' toolbar stands alone, so a contained card reads
          better — the two look close but aren't pixel-identical (accepted). Shadow
          is the shared --shadow-sticky token. `-mt-7` swallows the header's mb-7 to
          sit tight; `before` seals the seam above, as the KPI cards scroll behind. */}
      <div className="rounded-xl border border-line bg-surface-elev px-4 py-2.5 shadow-sticky md:sticky md:top-[76px] md:z-30 md:-mt-7 md:before:pointer-events-none md:before:absolute md:before:inset-x-0 md:before:bottom-full md:before:h-16 md:before:bg-surface-base md:before:content-['']">
        <StatisticsFilters
          years={yearOptions(currentYear)}
          selectedYear={selectedYear}
          onSelectYear={handleSelectYear}
          compareEnabled={compareEnabled}
          onToggleCompare={setCompareEnabled}
          compareYear={compareYear}
          onSelectCompareYear={setCompareYear}
          showExceptionals={showExceptionals}
          onToggleExceptionals={setShowExceptionals}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onToggleCategory={toggleCategory}
          maxCategories={MAX_CATEGORIES}
        />
      </div>

      <StatisticsKpis
        statistics={statistics}
        year={selectedYear}
        compareYear={compareYear}
        exceptionals={exceptionals}
        compareExceptionals={compareExceptionals}
        biggestRegular={biggestRegular}
        showExceptionals={showExceptionals}
        // The KPI cards only render once all four of their sources are in: a
        // partially-fed card shows a wrong value, and the two sparklines would
        // rescale on each arrival instead of drawing once (COS-183).
        isLoading={statisticsLoading || exceptionalsLoading || compareExceptionalsLoading || biggestRegularLoading}
      />

      <StatisticsForecast
        statistics={statistics}
        year={selectedYear}
        compareYear={compareYear}
        exceptionals={exceptionals}
        compareExceptionals={compareExceptionals}
        showExceptionals={showExceptionals}
      />

      <StatisticsMonthlyChart
        year={selectedYear}
        compareYear={compareYear}
        regularMonthly={regularMonthly}
        exceptionalMonthly={excMonthly}
        compareMonthly={compareMonthly}
        monthlyIncome={monthlyIncome ?? []}
        projectedRemainder={projectedRemainder}
        compareEnabled={compareEnabled}
        showExceptionals={showExceptionals}
        now={now}
      />

      {categorySeries.length > 0 && (
        // `scroll-mt-36` clears the sticky filter bar (top-[76px] + its height), so
        // the scrolled-to card lands under it rather than behind it.
        <div
          ref={categoryCardRef}
          className="scroll-mt-36"
        >
          <StatisticsCategoryChart
            year={selectedYear}
            series={categorySeries}
            monthsCount={monthsCount}
            compareYear={compareYear}
            compareEnabled={compareEnabled}
            now={now}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_5fr]">
        <StatisticsHeatmap
          year={selectedYear}
          now={now}
          days={dailyStats?.days}
          exceptionals={exceptionals}
        />
        <StatisticsTopCategories
          rows={topCategoryRows}
          compareYear={compareYear}
        />
      </div>

      <StatisticsFixedExpenses
        recurrings={recurrings ?? []}
        drawn={drawn ?? 0}
        now={now}
      />

      <StatisticsDayOfWeek
        year={selectedYear}
        now={now}
        days={dailyStats?.days}
        // The cached compare series is passed even when the toggle is off so the
        // widget can animate the compare marks out; the fetch itself stays gated.
        compareDays={compareDailyStats?.days}
        compareYear={compareYear}
        compareEnabled={compareEnabled}
        weekdayCategories={weekdayCategories?.weekdays}
        weeklyCeiling={dashboard.get.data?.initialCeiling ?? null}
      />

      {/* Exploration tool, last on purpose: it must not push the synthesis
          widgets below the fold. Autonomous — own search field, own range,
          blind to the page filters (a term is orthogonal to them). */}
      <StatisticsSearchTimeline />
    </div>
  );
};

export default StatisticsView;
