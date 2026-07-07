"use client";

import { useMemo, useState } from "react";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { ArrowDown, ArrowUp } from "lucide-react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useCharts from "@components/spendings/services/useCharts";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import { StackedBar, categoriesToSegments } from "@components/dataviz";
import { euro, pct1 } from "@components/overview/format";
import { cn } from "@lib/utils";

import type { ChartsCategory } from "@src/schemas/stats";

const FALLBACK_COLOR = "#94a3b8";

// MOCK — the month-over-month trend needs the previous month's per-category
// totals (not fetched here). Deterministic placeholder derived from the label.
const mockTrend = (name: string): { dir: "up" | "down" | "flat"; label: string } => {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const n = (hash % 83) - 40; // -40..+42
  if (Math.abs(n) < 3) return { dir: "flat", label: "stable" };
  return n > 0
    ? { dir: "up", label: `+${n}%` }
    : { dir: "down", label: `−${Math.abs(n)}%` };
};

/** Monthly category breakdown — stacked bar + list, click a row for details. */
const CategoryBreakdown = () => {
  const { from } = useDatePickerWrapperStore();
  const { data: charts, error } = useCharts(MONTHLY);
  const { spendingsByMonth } = useSpendings();
  const [selected, setSelected] = useState<ChartsCategory | null>(null);

  if (error) {
    throw error;
  }

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of spendingsByMonth ?? []) {
      const key = (s.category ?? "sans catégorie").toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [spendingsByMonth]);

  const list = charts ?? [];
  const total = list.reduce((a, c) => a + c.value, 0) || 1;
  const monthLabel = format(from ?? new Date(), "MMMM yyyy", { locale: fr });

  return (
    <section className="pfa-card flex flex-col gap-4 px-6 py-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Répartition par catégorie
        </h2>
        <span className="text-xs text-ink-4">{monthLabel} · part des variables</span>
      </div>

      {list.length > 0 ? (
        <>
          <StackedBar
            segments={categoriesToSegments(list)}
            height={8}
            radius={4}
            ariaLabel="Répartition mensuelle par catégorie"
          />
          <div className="charts-categories-list flex max-h-[340px] flex-col overflow-y-auto pr-1">
            {list.map((c, i) => {
              const color = c.categoryColor ?? FALLBACK_COLOR;
              const name = c.category ?? "sans catégorie";
              const count = counts.get(name.toLowerCase()) ?? 0;
              const trend = mockTrend(name);
              return (
                <button
                  key={`${c.category ?? "none"}-${i}`}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="grid grid-cols-[10px_minmax(0,1fr)_58px_84px_58px] items-center gap-3 border-b border-line-soft px-1 py-3 text-left text-[13.5px] transition-colors last:border-b-0 hover:bg-bg-hi"
                >
                  <span
                    className="size-2 rounded-[2px]"
                    style={{ background: color }}
                  />
                  <span className="flex items-center gap-2 truncate">
                    <span className="truncate capitalize text-ink">{name}</span>
                    {count > 0 && (
                      <span className="num shrink-0 rounded bg-bg-hi px-1.5 text-[10px] text-ink-4">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="num text-right text-ink-2">
                    {pct1((c.value / total) * 100)} %
                  </span>
                  <span className="num text-right text-ink">{euro(c.value)} €</span>
                  <span
                    className={cn(
                      "num flex items-center justify-end gap-1 text-right text-[11.5px]",
                      trend.dir === "up" && "text-neg",
                      trend.dir === "down" && "text-accent-strong",
                      trend.dir === "flat" && "text-ink-4",
                    )}
                  >
                    {trend.dir === "up" && <ArrowUp className="size-3" />}
                    {trend.dir === "down" && <ArrowDown className="size-3" />}
                    {trend.label}
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
