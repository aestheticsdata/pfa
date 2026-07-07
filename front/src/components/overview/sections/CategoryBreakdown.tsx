"use client";

import { useState } from "react";
import useCharts from "@components/spendings/services/useCharts";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import { StackedBar, categoriesToSegments } from "@components/dataviz";
import { euro, pct1 } from "@components/overview/format";

import type { ChartsCategory } from "@src/schemas/stats";

const FALLBACK_COLOR = "#94a3b8";

/** Monthly category breakdown — stacked bar + list, click a row for details. */
const CategoryBreakdown = () => {
  const { data: charts, error } = useCharts(MONTHLY);
  const [selected, setSelected] = useState<ChartsCategory | null>(null);

  if (error) {
    throw error;
  }

  const list = charts ?? [];
  const total = list.reduce((a, c) => a + c.value, 0) || 1;

  return (
    <section className="pfa-card flex flex-col gap-4 px-6 py-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Répartition par catégorie
        </h2>
        <span className="text-xs text-ink-4">{list.length} catégories · mois</span>
      </div>

      {list.length > 0 ? (
        <>
          <StackedBar
            segments={categoriesToSegments(list)}
            height={8}
            radius={4}
            ariaLabel="Répartition mensuelle par catégorie"
          />
          <div className="charts-categories-list flex max-h-[320px] flex-col overflow-y-auto pr-1">
            {list.map((c, i) => {
              const color = c.categoryColor ?? FALLBACK_COLOR;
              return (
                <button
                  key={`${c.category ?? "none"}-${i}`}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="grid grid-cols-[14px_minmax(0,1fr)_72px_92px] items-center gap-3 rounded border-b border-line-soft px-1 py-2.5 text-left transition-colors last:border-b-0 hover:bg-bg-hi"
                >
                  <span
                    className="size-2 rounded-[2px]"
                    style={{ background: color }}
                  />
                  <span className="truncate capitalize text-ink">
                    {c.category ?? "sans catégorie"}
                  </span>
                  <span className="num text-right text-ink-2">
                    {pct1((c.value / total) * 100)} %
                  </span>
                  <span className="num text-right text-ink">
                    {euro(c.value)} €
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="py-10 text-center text-[12.5px] text-ink-4">
          Aucune dépense ce mois.
        </div>
      )}

      {selected && (
        <SpendingsListModal
          handleClickOutside={() => setSelected(null)}
          periodType={MONTHLY}
          categoryInfos={selected}
          total={selected.value}
        />
      )}
    </section>
  );
};

export default CategoryBreakdown;
