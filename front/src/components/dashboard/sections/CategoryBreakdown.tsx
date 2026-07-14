"use client";

import { euro, pct1 } from "@components/dashboard/format";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { MONTHLY } from "@components/spendings/config/constants";
import useCharts from "@components/spendings/services/useCharts";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { CategoryBarTooltip, CategoryTrend, categoriesToSegments, StackedBar } from "@lib/dataviz";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { useMemo, useState } from "react";

import type { BarHover, CategoryTrendData } from "@lib/dataviz";
import type { ChartsCategory } from "@src/schemas/stats";

const FALLBACK_COLOR = "#94a3b8";

// MOCK — the month-over-month trend needs the previous month's per-category
// totals (not fetched here). Deterministic placeholder derived from the label.
// De-mocks with COS-41 (monthly), not COS-35 (weekly).
const mockTrend = (name: string): CategoryTrendData => {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const n = (hash % 83) - 40; // -40..+42
  if (Math.abs(n) < 3) return { direction: "flat", label: "stable" };
  return n > 0 ? { direction: "up", label: `+${n}%` } : { direction: "down", label: `−${Math.abs(n)}%` };
};

/** Monthly category breakdown — stacked bar + list, click a row for details. */
const CategoryBreakdown = () => {
  const { from } = useDatePickerWrapperStore();
  const { data: charts, error } = useCharts(MONTHLY);
  const { spendingsByMonth } = useSpendings();
  const [selected, setSelected] = useState<ChartsCategory | null>(null);
  const [hover, setHover] = useState<BarHover<number> | null>(null);

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

  // One derived row per category, shared by the list AND the hover tooltip so
  // both render identical values (no recompute). Order matches the bar segments.
  const rows = list.map((category) => {
    const name = category.category ?? "sans catégorie";
    return {
      category,
      color: category.categoryColor ?? FALLBACK_COLOR,
      name,
      count: counts.get(name.toLowerCase()) ?? 0,
      pct: (category.value / total) * 100,
      total: category.value,
      trend: mockTrend(name),
    };
  });

  return (
    <section className="pfa-card flex max-h-137.5 min-h-80 flex-col gap-4 px-6 py-5">
      <CardSectionHeader
        title="Répartition par catégorie"
        meta={`${monthLabel} · part des variables`}
      />

      {list.length > 0 ? (
        <>
          <StackedBar
            segments={categoriesToSegments(list)}
            height={8}
            radius={4}
            ariaLabel="Répartition mensuelle par catégorie"
            onSegmentHover={(index, e) => setHover({ target: index, x: e.clientX, y: e.clientY })}
            onSegmentLeave={() => setHover(null)}
          />
          <div className="charts-categories-list flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            {rows.map((row) => (
              <button
                key={row.name}
                type="button"
                onClick={() => setSelected(row.category)}
                className="grid cursor-pointer grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-soft px-1 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-surface-hi sm:grid-cols-[10px_minmax(0,1fr)_58px_84px_58px]"
              >
                <span
                  className="size-2 rounded-xs"
                  style={{ background: row.color }}
                />
                <span className="flex items-center gap-2 truncate">
                  <span className="truncate capitalize text-ink">{row.name}</span>
                  {row.count > 0 && (
                    <span className="num shrink-0 rounded bg-surface-hi px-1.5 text-2xs text-ink-4">{row.count}</span>
                  )}
                </span>
                <span className="num hidden text-right text-ink-2 sm:block">{pct1(row.pct)} %</span>
                <span className="num text-right text-ink">{euro(row.total)} €</span>
                <CategoryTrend
                  {...row.trend}
                  className="hidden sm:flex"
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <EmptyState className="py-10">Aucune dépense ce mois.</EmptyState>
      )}

      {hover && (
        <CategoryBarTooltip
          point={{ x: hover.x, y: hover.y }}
          datum={rows[hover.target]}
        />
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
