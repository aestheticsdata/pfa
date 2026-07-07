"use client";

import { useMemo, useState } from "react";
import useStatistics from "@components/statistics/services/useStatistics";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import StatisticsFilters from "@components/statistics/StatisticsFilters";
import StatisticsKpis from "@components/statistics/StatisticsKpis";
import StatisticsForecast from "@components/statistics/StatisticsForecast";

const MAX_CATEGORIES = 3;

const yearOptions = (currentYear: number): number[] =>
  Array.from({ length: 7 }, (_, i) => currentYear - i);

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

  const years = useMemo(
    () => Array.from(new Set([selectedYear, compareYear])),
    [selectedYear, compareYear],
  );

  const { statistics, categories } = useStatistics({ years });
  const { exceptionals } = useExceptionals({ year: selectedYear });
  const { exceptionals: compareExceptionals } = useExceptionals({
    year: compareYear,
  });

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setCompareYear(year - 1);
  };

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < MAX_CATEGORIES
          ? [...prev, id]
          : prev,
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
    </div>
  );
};

export default StatisticsView;
