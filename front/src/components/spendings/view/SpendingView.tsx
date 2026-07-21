"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import { WEEKLY } from "@components/spendings/config/constants";
import dailyRemainingBudget from "@components/spendings/helpers/dailyBudget";
import useEnsureWeekRange from "@components/spendings/helpers/useEnsureWeekRange";
import useCategoryTrends from "@components/spendings/services/useCategoryTrends";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingCategoryBreakdown from "@components/spendings/view/SpendingCategoryBreakdown";
import SpendingCategoryFilter from "@components/spendings/view/SpendingCategoryFilter";
import SpendingDayCard from "@components/spendings/view/SpendingDayCard";
import SpendingSummary from "@components/spendings/view/SpendingSummary";
import SpendingToolbar from "@components/spendings/view/SpendingToolbar";
import { Button } from "@components/ui/button";
import common from "@text/common";
import spendings from "@text/spendings";
import { endOfMonth, isSameDay } from "date-fns";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { BreakdownRow } from "@components/spendings/interfaces/spendingCategoryBreakdownTypes";
import type { FilterCategory } from "@components/spendings/interfaces/spendingCategoryFilterTypes";
import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingDayGroup } from "@components/spendings/types";

const FALLBACK_COLOR = CATEGORY_FALLBACK;
const UNCATEGORIZED_KEY = "none";

interface CategoryAggregate {
  key: string;
  category: string | null;
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
  const { from, to, range, scrollToDayIso, setScrollToDayIso } = useDatePickerWrapperStore();
  const [now] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEnsureWeekRange();

  const { spendingsByWeek, isLoading, error } = useSpendings();
  const { get: dashboardQuery, remaining } = useDashboard();
  // Previous-week aggregates for the "vs sem. dernière" deltas (COS-35): the
  // per-category totals feed the breakdown trend arrows, `previousTotal` the
  // avg/day delta below. Same GET /category-trends the dashboard uses, windowed
  // to the picked week vs the 7 days before it.
  const { data: trendsData } = useCategoryTrends(WEEKLY);

  const groups = useMemo<SpendingDayGroup[]>(() => spendingsByWeek ?? [], [spendingsByWeek]);

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
            category: tx.category ?? null,
            name: tx.category ?? spendings.noCategory,
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

  // Auto-scroll the timeline to a requested day card (COS-38). Both the NavBar
  // "Aujourd'hui" button and a fresh spending creation set `scrollToDayIso`; we
  // scroll as soon as the matching `[data-sp-day]` card is in the DOM. That can
  // be immediately (already the right week) or after a re-render triggered by a
  // week navigation (`range`) or the initial data load (`isLoading`), so the
  // effect re-runs on those. The request is consumed (reset to null) once used.
  useEffect(() => {
    if (!scrollToDayIso || !range || isLoading) {
      return;
    }
    const card = document.querySelector<HTMLElement>(`[data-sp-day="${scrollToDayIso}"]`);
    if (!card) {
      return;
    }
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    setScrollToDayIso(null);
  }, [scrollToDayIso, range, isLoading, setScrollToDayIso]);

  // Drop any pending scroll request when leaving the page so it can't fire on a
  // later visit (COS-38).
  useEffect(() => () => setScrollToDayIso(null), [setScrollToDayIso]);

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
  // "Budget du jour maximum" — remaining monthly budget spread over the days left
  // in the month (today included). Shared with the Dashboard "reste à vivre" so
  // the two always match; only rendered on today's card (see SpendingDayCard).
  const dailyBudget = dashboardQuery.data ? dailyRemainingBudget(remaining, now) : null;
  // Threshold for each day-card total colour (COS-34): the weekly ceiling split
  // over the number of cards actually shown (not always 7). The same ceiling the
  // weekly "vs plafond" widget uses, so day and week colours stay consistent.
  const ceilingPerDay = weeklyCeiling != null && groups.length > 0 ? weeklyCeiling / groups.length : null;

  const grand = weekTotal || 1;
  const trends = trendsData?.trends;
  // Match previous-week totals to the current-week rows by category name (both
  // sides collapse user+global same-name categories the same way). While the
  // trends query is still loading, `previousValue` stays `undefined` so the trend
  // badge is hidden rather than flashing a wrong "nouv.".
  const previousByCategory = new Map<string | null, number | null>(
    (trends ?? []).map((tr) => [tr.category, tr.previousValue]),
  );
  const breakdownRows: BreakdownRow[] = categoryAgg.map((c) => ({
    ...c,
    pct: (c.total / grand) * 100,
    previousValue: trends === undefined ? undefined : (previousByCategory.get(c.category) ?? null),
  }));

  // Δ average/day vs last week: this week's avg/day (weekTotal / 7, the figure the
  // tile shows) minus last week's (previousTotal / 7). null until previousTotal
  // loads → the caption is hidden meanwhile, never a placeholder number.
  const previousTotal = trendsData?.previousTotal;
  const avgDailyDelta = previousTotal == null ? null : weekTotal / 7 - previousTotal / 7;
  const filterCategories: FilterCategory[] = categoryAgg.map(({ key, name, color, count }) => ({
    key,
    name,
    color,
    count,
  }));

  const rangeLabel = `${format(from, "dd")} — ${format(to, "dd MMM yyyy", {
    locale: fr,
  })}`;

  const isInitialLoading = isLoading && !spendingsByWeek;

  return (
    <div className="flex flex-col gap-5">
      {/* Search + category filter + summary + breakdown stay pinned under the app header while
          the timeline scrolls (desktop only). Tighter gap than the page flow (12px vs 20px):
          pinned chrome is denser, and every pixel here is taken from the cards.
          The negative margins bleed the opaque band across the layout gutter (px-6, px-8 from
          lg — keep in sync with PrivateLayout) so the today card's ring/glow that
          paints outside its box stays visible beside the band; the matching padding puts the
          content back, aligned with the header. `-mt-7` swallows the header's mb-7 and `pt-3`
          re-adds the wanted 12px gap so it stays opaque once stuck (COS-101/104). The strip
          above the header is masked app-wide by `.pfa-shell::before`. */}
      <div className="flex flex-col gap-3 md:sticky md:top-[76px] md:z-30 md:-mx-6 md:-mt-7 md:bg-surface-base md:px-6 md:pt-3 md:shadow-sticky lg:-mx-8 lg:px-8">
        <SpendingToolbar
          search={search}
          onSearchChange={setSearch}
        >
          <SpendingCategoryFilter
            categories={filterCategories}
            total={txCount}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </SpendingToolbar>

        <SpendingSummary
          remaining={remaining}
          weekTotal={weekTotal}
          txCount={txCount}
          weeklyCeiling={weeklyCeiling}
          avgDailyDelta={avgDailyDelta}
          biggest={biggest}
        />

        <SpendingCategoryBreakdown
          rows={breakdownRows}
          rangeLabel={rangeLabel}
        />
      </div>

      {isInitialLoading ? (
        <div className="grid place-items-center py-16 text-sm text-ink-4">{common.loading}</div>
      ) : (
        <section className="grid grid-cols-1 items-start gap-4 min-[760px]:grid-cols-[repeat(auto-fill,minmax(500px,1fr))]">
          {groups.map((group, i) => (
            <SpendingDayCard
              key={group.dayOfMonth}
              date={range[i]}
              items={group.items}
              total={group.total}
              dailyBudget={dailyBudget}
              ceilingPerDay={ceilingPerDay}
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
        className="fixed bottom-6 right-6 z-30 shadow-float"
      >
        <Plus className="size-4" />
        {spendings.view.newSpending}
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
