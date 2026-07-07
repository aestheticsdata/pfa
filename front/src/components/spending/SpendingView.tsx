"use client";

import { useMemo, useState } from "react";
import { endOfMonth, isSameDay } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import { Button } from "@components/ui/button";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useEnsureWeekRange from "@components/spendings/helpers/useEnsureWeekRange";
import useSpendings from "@components/spendings/services/useSpendings";
import useDashboard from "@components/spendings/services/useDashboard";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import SpendingToolbar from "@components/spending/SpendingToolbar";
import SpendingSummary from "@components/spending/SpendingSummary";
import SpendingCategoryBreakdown from "@components/spending/SpendingCategoryBreakdown";
import SpendingCategoryFilter from "@components/spending/SpendingCategoryFilter";
import SpendingDayCard from "@components/spending/SpendingDayCard";
import { mockAvgDailyDelta } from "@components/spending/helpers/mockSpending";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingDayGroup } from "@components/spendings/types";
import type { BreakdownRow } from "@components/spending/SpendingCategoryBreakdown";
import type { FilterCategory } from "@components/spending/SpendingCategoryFilter";

const FALLBACK_COLOR = "#94a3b8";
const UNCATEGORIZED_KEY = "none";

interface CategoryAggregate {
  key: string;
  name: string;
  color: string;
  count: number;
  total: number;
}

/**
 * Dépenses (weekly) page — redesigned in Phase 3b. Toolbar, weekly summary,
 * per-category breakdown, a global category filter and the new glow day-cards
 * timeline. Reuses the existing data layer (useSpendings / useDashboard).
 */
const SpendingView = () => {
  const { from, to, range } = useDatePickerWrapperStore();
  const [now] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEnsureWeekRange();

  const { spendingsByWeek, isLoading, error } = useSpendings();
  const { get: dashboardQuery } = useDashboard();

  const groups = useMemo<SpendingDayGroup[]>(
    () => spendingsByWeek ?? [],
    [spendingsByWeek],
  );

  const { weekTotal, txCount, biggest, categoryAgg } = useMemo(() => {
    let total = 0;
    let count = 0;
    let largest: { label: string; amount: number; date: Date } | null = null;
    const map = new Map<string, CategoryAggregate>();

    for (const group of groups) {
      total += group.total;
      for (const tx of group.items) {
        const amount = Number(tx.amount);
        count += 1;
        if (!largest || amount > largest.amount) {
          largest = { label: tx.label, amount, date: parseISO(tx.date) };
        }
        const key = tx.category ?? UNCATEGORIZED_KEY;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          existing.total += amount;
        } else {
          map.set(key, {
            key,
            name: tx.category ?? "sans catégorie",
            color: tx.categoryColor || FALLBACK_COLOR,
            count: 1,
            total: amount,
          });
        }
      }
    }

    return {
      weekTotal: total,
      txCount: count,
      biggest: largest,
      categoryAgg: Array.from(map.values()).sort((a, b) => b.total - a.total),
    };
  }, [groups]);

  if (error) {
    throw error;
  }

  if (!from || !to || !range) {
    return null;
  }

  const month: MonthRange = {
    start: startOfMonth(from),
    end: endOfMonth(to),
  };

  const weeklyCeiling = dashboardQuery.data?.initialCeiling ?? null;
  const dailyBudget =
    weeklyCeiling != null && weeklyCeiling > 0 ? weeklyCeiling / 7 : null;

  const grand = weekTotal || 1;
  const breakdownRows: BreakdownRow[] = categoryAgg.map((c) => ({
    ...c,
    pct: (c.total / grand) * 100,
  }));
  const filterCategories: FilterCategory[] = categoryAgg.map(
    ({ key, name, color, count }) => ({ key, name, color, count }),
  );

  const rangeLabel = `${format(from, "dd")} — ${format(to, "dd MMM yyyy", {
    locale: fr,
  })}`;

  const isInitialLoading = isLoading && !spendingsByWeek;

  return (
    <div className="flex flex-col gap-5">
      <SpendingToolbar search={search} onSearchChange={setSearch} />

      <SpendingSummary
        weekTotal={weekTotal}
        txCount={txCount}
        weeklyCeiling={weeklyCeiling}
        avgDailyDelta={mockAvgDailyDelta(from.toISOString().slice(0, 10))}
        biggest={biggest}
      />

      <SpendingCategoryBreakdown rows={breakdownRows} rangeLabel={rangeLabel} />

      <SpendingCategoryFilter
        categories={filterCategories}
        total={txCount}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {isInitialLoading ? (
        <div className="grid place-items-center py-16 text-sm text-ink-4">
          Chargement…
        </div>
      ) : (
        <section className="sp-timeline">
          {groups.map((group, i) => (
            <SpendingDayCard
              key={group.dayOfMonth}
              date={range[i]}
              items={group.items}
              total={group.total}
              dailyBudget={dailyBudget}
              isToday={isSameDay(range[i], now)}
              month={month}
              selectedCategory={selectedCategory}
              search={search}
              onSelectCategory={setSelectedCategory}
            />
          ))}
        </section>
      )}

      {/* Floating action button — fixed bottom-right (design: .open-modal-btn) */}
      <Button
        type="button"
        variant="primary"
        onClick={() => setIsQuickAddOpen(true)}
        className="fixed bottom-6 right-6 z-30 shadow-[0_10px_30px_oklch(0_0_0/0.35)]"
      >
        <Plus className="size-4" />
        Nouvelle dépense
      </Button>

      {isQuickAddOpen && (
        <SpendingModal
          date={now}
          closeModal={() => setIsQuickAddOpen(false)}
          spending={null}
          isEditing={false}
          month={month}
        />
      )}
    </div>
  );
};

export default SpendingView;
