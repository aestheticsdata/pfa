"use client";

import { useState } from "react";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useCharts from "@components/spendings/services/useCharts";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { SurfaceCard } from "@components/ui/surface-card";
import { WEEKLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import dashboardText from "@components/spendings/config/text";
import { cn } from "@lib/utils";
import adjustFontColor from "@components/shared/helpers/adjustColor";

import type { ChartsCategory } from "@src/schemas/stats";

const WeeklyChartCard = () => {
  const { from, to } = useDatePickerWrapperStore();
  const { data: charts, error } = useCharts(WEEKLY);
  const [selectedCategory, setSelectedCategory] = useState<ChartsCategory | null>(
    null,
  );

  if (error) {
    throw error;
  }
  if (!from || !to) return null;

  const total =
    charts?.reduce((acc, c) => acc + (c.value ?? 0), 0) ?? 0;
  const maxValue =
    charts && charts.length > 0
      ? Math.max(...charts.map((c) => c.value ?? 0))
      : 0;

  // Sort by value desc, cap visible to top 10 to avoid overflow
  const sortedCharts = [...(charts ?? [])]
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 10);

  return (
    <>
      <SurfaceCard padding="lg" className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-gray-100 text-lg font-medium">
              {dashboardText.dashboard.weeklyCharts.headerTitle}
            </h3>
            <span className="text-gray-500 text-sm">
              {format(from, "dd MMM yyyy", { locale: fr })} —{" "}
              {format(to, "dd MMM yyyy", { locale: fr })}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-gray-400 text-sm">Total de la semaine</span>
            <span className="text-gray-100 text-lg font-medium tabular-nums">
              {total.toFixed(2)} €
            </span>
          </div>
        </div>

        {sortedCharts.length === 0 ? (
          <div className="flex justify-center items-center h-24 text-sm text-gray-500">
            Aucune donnée pour cette période
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
            {sortedCharts.map((cat, idx) => {
              const value = cat.value ?? 0;
              const percent = total > 0 ? (value / total) * 100 : 0;
              const fillRatio = maxValue > 0 ? value / maxValue : 0;
              const color = cat.categoryColor ?? "#64748b";
              const textColor =
                adjustFontColor(color) === "#ffffff" ? "#ffffff" : "#0a0a0a";

              return (
                <button
                  type="button"
                  key={`${cat.category ?? "uncategorized"}-${idx}`}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex flex-col gap-2 group text-left border-0 outline-none focus:outline-none focus-visible:outline-none bg-transparent p-0 cursor-pointer"
                >
                  <div className="relative h-[140px] bg-[#1c1c1c] border-0 outline-none rounded-lg overflow-hidden flex flex-col justify-end transition-colors group-hover:bg-[#2a2a2a]">
                    <div
                      className={cn(
                        "w-full rounded-lg flex items-start justify-center pt-2 transition-all min-h-[32px] group-hover:brightness-125 group-hover:saturate-150",
                      )}
                      style={{
                        height: `${Math.max(fillRatio * 100, 20)}%`,
                        backgroundColor: color,
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: textColor }}
                      >
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="text-gray-200 text-sm uppercase font-medium truncate w-full transition-colors group-hover:text-gray-100"
                      title={cat.category ?? "Sans catégorie"}
                    >
                      {cat.category ?? "Sans catégorie"}
                    </div>
                    <div className="text-gray-500 text-xs tabular-nums">
                      {value.toFixed(2)}€
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      {selectedCategory && (
        <SpendingsListModal
          handleClickOutside={() => setSelectedCategory(null)}
          periodType={WEEKLY}
          categoryInfos={selectedCategory}
          total={selectedCategory.value ?? 0}
        />
      )}
    </>
  );
};

export default WeeklyChartCard;
