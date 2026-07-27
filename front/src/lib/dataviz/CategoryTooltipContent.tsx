"use client";

import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import CategoryTrend from "@lib/dataviz/CategoryTrend";

import type { CategoryTooltipDatum } from "@lib/dataviz/interfaces/dataVizTypes";

interface CategoryTooltipContentProps {
  datum: CategoryTooltipDatum;
}

/**
 * Body of a stacked category bar's hover tooltip: mirrors the list row (swatch
 * / name / count / % / amount / trend). Shared by the Spendings and Dashboard
 * breakdowns, which render it inside `<Tooltip mode="cursor">` — the bubble
 * (surface, border, fade, positioning) belongs to the tooltip, not here.
 */
const CategoryTooltipContent = ({ datum }: CategoryTooltipContentProps) => {
  const { euro, pct1 } = useFormat();
  const { categoryChart: t } = useTranslations("statistics");

  return (
    // Floor width so a short category name still gets a readable two-column grid.
    <div className="min-w-38">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-xs"
          style={{ background: datum.color }}
        />
        <span className="truncate text-sm font-medium capitalize text-ink">{datum.name}</span>
        {datum.count != null && (
          <span className="ml-auto shrink-0 rounded-full border border-line-soft bg-surface-base px-2 text-2xs leading-normal text-ink-3">
            {datum.count}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-1 text-xs">
        <span className="text-ink-4">{t.tooltipShare}</span>
        <span className="text-right text-ink-2">{pct1(datum.pct)} %</span>
        <span className="text-ink-4">{t.tooltipAmount}</span>
        <span className="text-right text-ink">{euro(datum.total)} €</span>
        {datum.trend && (
          <>
            <span className="text-ink-4">{t.tooltipTrend}</span>
            <CategoryTrend {...datum.trend} />
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryTooltipContent;
