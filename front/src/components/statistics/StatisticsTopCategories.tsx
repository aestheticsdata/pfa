"use client";

import { euro0 } from "@components/dashboard/format";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface TopCategoryRow {
  name: string;
  color: string;
  value: number;
  /** Year-over-year change in %, or null when the category is new this year. */
  deltaPct: number | null;
}

interface StatisticsTopCategoriesProps {
  rows: TopCategoryRow[];
  compareYear: number;
}

const Trend = ({ deltaPct }: { deltaPct: number | null }) => {
  if (deltaPct == null) {
    return <span className="text-ink-4">nouv.</span>;
  }
  const rounded = Math.round(deltaPct);
  if (rounded === 0) {
    return <span className="text-ink-4">— 0%</span>;
  }
  // spending up = worse (red), down = better (green)
  const up = rounded > 0;
  return (
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
};

/** "Top catégories" — the year's largest categories with their real
 *  year-over-year trend (all figures from /statistics). */
const StatisticsTopCategories = ({ rows, compareYear }: StatisticsTopCategoriesProps) => (
  <GlowCard className="flex flex-col px-6 py-[22px]">
    <CardSectionHeader
      title="Top catégories"
      meta={`tendance vs ${compareYear}`}
    />

    <div className="mt-[18px] flex flex-col">
      <div className="mb-0.5 grid grid-cols-[14px_1fr_90px_80px] items-center gap-2.5 border-b border-line pb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-4">
        <span />
        <span>Catégorie</span>
        <span className="text-right">Total</span>
        <span className="text-right">vs {compareYear}</span>
      </div>

      {rows.map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[14px_1fr_90px_80px] items-center gap-2.5 border-b border-line-soft py-2.5 text-[13px] last:border-b-0"
        >
          <span
            className="size-2 rounded-[2px]"
            style={{ background: row.color }}
          />
          <span className="truncate capitalize text-ink">{row.name}</span>
          <span className="num text-right font-medium text-ink">{euro0(row.value)} €</span>
          <span className="num flex justify-end text-right text-[12px]">
            <Trend deltaPct={row.deltaPct} />
          </span>
        </div>
      ))}
    </div>
  </GlowCard>
);

export default StatisticsTopCategories;
