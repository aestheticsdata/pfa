"use client";

import { CategoryColorDot } from "@components/categories/CategoryColorDot";
import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import { EmptyState } from "@components/shared/EmptyState";
import GlowCard from "@components/shared/GlowCard";
import { MONTHLY } from "@components/spendings/config/constants";
import { categoryTrend } from "@components/spendings/helpers/categoryTrend";
import useCategoryTrends from "@components/spendings/services/useCategoryTrends";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { Tooltip } from "@components/ui/tooltip";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { CategoryTooltipContent, CategoryTrend, categoriesToSegments, StackedBar } from "@lib/dataviz";
import format from "date-fns/format";
import { useMemo, useState } from "react";

import type { BarHover } from "@lib/dataviz";
import type { CategoryTrendPoint } from "@src/schemas/stats";

const FALLBACK_COLOR = CATEGORY_FALLBACK;

/** Monthly category breakdown — stacked bar + list, click a row for details. */
const CategoryBreakdown = () => {
  const { euro, pct1 } = useFormat();
  const dashboardText = useTranslations("dashboard");
  const common = useTranslations("common");
  const dateLocale = useDateLocale();
  const { from } = useDatePickerWrapperStore();
  const { data } = useCategoryTrends(MONTHLY);
  const trends = data?.trends;
  const { spendingsByMonth } = useSpendings();
  const [selected, setSelected] = useState<CategoryTrendPoint | null>(null);
  const [hover, setHover] = useState<BarHover<number> | null>(null);
  const { categoryBreakdown: t } = dashboardText;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of spendingsByMonth ?? []) {
      const key = (s.category ?? t.uncategorized).toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [spendingsByMonth, t.uncategorized]);

  const list = trends ?? [];
  const total = list.reduce((a, c) => a + c.value, 0) || 1;
  const monthLabel = format(from ?? new Date(), "MMMM yyyy", { locale: dateLocale });

  // One derived row per category, shared by the list AND the hover tooltip so
  // both render identical values (no recompute). Order matches the bar segments.
  const rows = list.map((category) => {
    const name = category.category ?? t.uncategorized;
    return {
      category,
      color: category.categoryColor ?? FALLBACK_COLOR,
      name,
      count: counts.get(name.toLowerCase()) ?? 0,
      pct: (category.value / total) * 100,
      total: category.value,
      trend: categoryTrend(category.value, category.previousValue, { stable: t.trendStable, fresh: t.trendNew }),
    };
  });

  return (
    <GlowCard
      as="section"
      className="flex max-h-137.5 min-h-80 flex-col gap-4 px-6 py-5"
    >
      <CardSectionHeader
        title={t.title}
        meta={t.meta(monthLabel)}
      />

      {list.length > 0 ? (
        <>
          <StackedBar
            segments={categoriesToSegments(list, common.category.uncategorized)}
            height={8}
            radius={4}
            ariaLabel={t.barAria}
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
                <CategoryColorDot color={row.color} />
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
        <EmptyState className="py-10">{t.empty}</EmptyState>
      )}

      {/* Rendered unconditionally: the tooltip owns its fade in AND out, so it
          needs to outlive the hover it is fading away from. */}
      <Tooltip
        mode="cursor"
        point={hover ? { x: hover.x, y: hover.y } : null}
      >
        {hover && <CategoryTooltipContent datum={rows[hover.target]} />}
      </Tooltip>

      {selected && (
        <SpendingsListModal
          handleClickOutside={() => setSelected(null)}
          periodType={MONTHLY}
          categoryInfos={selected}
          total={selected.value}
        />
      )}
    </GlowCard>
  );
};

export default CategoryBreakdown;
