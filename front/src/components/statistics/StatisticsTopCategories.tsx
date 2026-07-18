"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { CursorTooltip, useCursorHover } from "@lib/dataviz";
import { euro0 } from "@lib/format";
import statistics from "@text/statistics";
import { ChevronDown, ChevronUp } from "lucide-react";

const { topCategories: t } = statistics;

export interface TopCategoryRow {
  name: string;
  color: string;
  value: number;
  /** Year-over-year change in %, or null when the category is new this year. */
  deltaPct: number | null;
  /** The compare-year total for this category (0 when absent that year). */
  compareValue: number;
}

interface StatisticsTopCategoriesProps {
  rows: TopCategoryRow[];
  compareYear: number;
}

const Trend = ({
  deltaPct,
  value,
  compareValue,
  compareYear,
}: {
  deltaPct: number | null;
  value: number;
  compareValue: number;
  compareYear: number;
}) => {
  const trendTip = useCursorHover();
  let inner: React.ReactNode;
  if (deltaPct == null) {
    inner = <span className="text-ink-4">{t.new}</span>;
  } else {
    const rounded = Math.round(deltaPct);
    if (rounded === 0) {
      inner = <span className="text-ink-4">— 0%</span>;
    } else {
      // spending up = worse (red), down = better (green)
      const up = rounded > 0;
      inner = (
        <span className={`inline-flex items-center gap-1 ${up ? "text-neg" : "text-accent-strong"}`}>
          {up ? (
            <ChevronUp
              size={9}
              strokeWidth={3}
            />
          ) : (
            <ChevronDown
              size={9}
              strokeWidth={3}
            />
          )}
          {up ? "+" : "−"}
          {Math.abs(rounded)}%
        </span>
      );
    }
  }

  const diff = value - compareValue;
  const tooltip =
    deltaPct == null
      ? t.tooltip.newCategory(compareYear)
      : t.tooltip.trend(compareYear, euro0(compareValue), `${diff >= 0 ? "+" : "−"}${euro0(Math.abs(diff))}`);

  return (
    <>
      <span
        role="img"
        aria-label={tooltip}
        onMouseMove={trendTip.move()}
        onMouseLeave={trendTip.clear}
      >
        {inner}
      </span>
      <CursorTooltip point={trendTip.hover}>{trendTip.hover ? tooltip : null}</CursorTooltip>
    </>
  );
};

/** "Top catégories" — the year's largest categories with their real
 *  year-over-year trend (all figures from /statistics). */
const StatisticsTopCategories = ({ rows, compareYear }: StatisticsTopCategoriesProps) => {
  const nameTip = useCursorHover<string>();
  return (
    <GlowCard className="flex flex-col px-6 py-5.5">
      <CardSectionHeader
        title={t.title}
        meta={t.meta(compareYear)}
      />

      <div className="mt-4.5 flex flex-col">
        <div className="mb-0.5 grid grid-cols-[14px_1fr_90px_80px] items-center gap-2.5 border-b border-line pb-2 text-2xs font-medium uppercase tracking-caps text-ink-4">
          <span />
          <span>{t.colCategory}</span>
          <span className="text-right">{t.colTotal}</span>
          <span className="text-right">{t.colVs(compareYear)}</span>
        </div>

        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[14px_1fr_90px_80px] items-center gap-2.5 border-b border-line-soft py-2.5 text-sm last:border-b-0"
          >
            <span
              className="size-2 rounded-xs"
              style={{ background: row.color }}
            />
            <span
              className="truncate capitalize text-ink"
              role="img"
              aria-label={row.name}
              onMouseMove={nameTip.move(row.name)}
              onMouseLeave={nameTip.clear}
            >
              {row.name}
            </span>
            <span className="num text-right font-medium text-ink">{euro0(row.value)} €</span>
            <span className="num flex justify-end text-right text-xs">
              <Trend
                deltaPct={row.deltaPct}
                value={row.value}
                compareValue={row.compareValue}
                compareYear={compareYear}
              />
            </span>
          </div>
        ))}
      </div>

      <CursorTooltip point={nameTip.hover}>
        {nameTip.hover ? <span className="capitalize">{nameTip.hover.data}</span> : null}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsTopCategories;
