"use client";

import useExceptionals from "@components/exceptionals/services/useExceptionals";
import useDashboard from "@components/spendings/services/useDashboard";
import useReccurings from "@components/spendings/services/useReccurings";
import { exceptionalMonthly } from "@components/statistics/helpers/exceptionalsData";
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
import StatisticsTopCategories from "@components/statistics/StatisticsTopCategories";
import useDailyStats from "@components/statistics/services/useDailyStats";
import useStatistics from "@components/statistics/services/useStatistics";
import { useMemo, useState } from "react";

const MAX_CATEGORIES = 3;

const yearOptions = (currentYear: number): number[] => Array.from({ length: 7 }, (_, i) => currentYear - i);

/**
 * Statistiques (/statistics) — redesigned on the custom dataviz lib (Phase 6).
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

  const years = useMemo(() => Array.from(new Set([selectedYear, compareYear])), [selectedYear, compareYear]);

  const { statistics, categories } = useStatistics({ years });
  const { dailyStats } = useDailyStats({ year: selectedYear });
  const { exceptionals } = useExceptionals({ year: selectedYear });
  const { exceptionals: compareExceptionals } = useExceptionals({
    year: compareYear,
  });
  const dashboard = useDashboard();
  const { recurrings } = useReccurings();

  const data = statistics?.data;
  const colors = statistics?.colors ?? {};
  const regularMonthly = monthlyTotals(data, selectedYear);
  const excMonthly = exceptionalMonthly(exceptionals);
  const compareMonthly = monthlyTotals(data, compareYear);
  const monthlyBudget = dashboard.get.data ? Number(dashboard.get.data.initialAmount) || null : null;

  const prevTotals = perCategoryTotals(data, colors, compareYear);
  const prevByName = new Map(prevTotals.map((c) => [c.name, c.value]));
  const topCategoryRows = perCategoryTotals(data, colors, selectedYear)
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

  const categorySeries = selectedCategoryIds
    .map((id) => categories.find((c) => c.ID === id))
    .filter((c): c is (typeof categories)[number] => Boolean(c))
    .map((category) => ({
      name: category.name,
      color: statistics?.colors?.[category.name] ?? category.color,
      monthly: categoryMonthly(data, selectedYear, category.name),
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

  return (
    <div className="flex flex-col gap-4">
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

      <StatisticsKpis
        statistics={statistics}
        year={selectedYear}
        compareYear={compareYear}
        exceptionals={exceptionals}
        compareExceptionals={compareExceptionals}
        showExceptionals={showExceptionals}
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
        monthlyBudget={monthlyBudget}
        compareEnabled={compareEnabled}
        showExceptionals={showExceptionals}
        now={now}
      />

      {categorySeries.length > 0 && (
        <StatisticsCategoryChart
          year={selectedYear}
          series={categorySeries}
          monthsCount={monthsCount}
          now={now}
        />
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
        now={now}
      />

      <StatisticsDayOfWeek
        year={selectedYear}
        now={now}
        days={dailyStats?.days}
        weeklyCeiling={dashboard.get.data?.initialCeiling ?? null}
      />
    </div>
  );
};

export default StatisticsView;
