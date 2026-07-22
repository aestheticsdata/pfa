"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { WEEKLY } from "@components/spendings/config/constants";
import { categoryTrend } from "@components/spendings/helpers/categoryTrend";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { CategoryBarTooltip, CategoryTrend } from "@lib/dataviz";
import { cn } from "@lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { BreakdownRow } from "@components/spendings/interfaces/spendingCategoryBreakdownTypes";
import type { BarHover, CategoryTrendData } from "@lib/dataviz";

/** A breakdown row plus its derived trend badge — undefined while previous-week
 *  data is still loading (badge hidden until then). */
type BreakdownRowWithTrend = BreakdownRow & { trend?: CategoryTrendData };

// Persisted open/closed state of the detail list (COS-112). The segment bar stays
// visible whatever the state — it IS the collapsed summary (hover gives per-category
// detail), so folding the list only trades the breakdown table for sticky-zone height.
const COLLAPSE_KEY = "pfa:sp-catrep-collapsed";
const DETAIL_ID = "sp-catrep-detail";

// Lazy initial value: honour the stored choice, else default collapsed in the desktop
// sticky zone (≥ 768px, where the height matters) and expanded on mobile (not sticky).
// SSR renders `null` here (rows are client-fetched → empty), so reading window is safe.
const initialCollapsed = () => {
  if (typeof window === "undefined") {
    return true;
  }
  const stored = window.localStorage.getItem(COLLAPSE_KEY);
  if (stored !== null) {
    return stored === "1";
  }
  return window.matchMedia("(min-width: 768px)").matches;
};

// Has the user ever chosen a state? While they haven't, a first-visit hint nudges
// them to unfold — the reason collapsed-by-default is acceptable (see COS-112).
const initialHasStoredPref = () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) !== null;

interface SpendingCategoryBreakdownProps {
  rows: BreakdownRow[];
  rangeLabel: string;
}

/**
 * Full-width "Breakdown by category" pane for the current week.
 * Stacked bar + per-category swatch / name / count / % / amount / trend (the
 * trend compares each category to the previous week — COS-35).
 */
const SpendingCategoryBreakdown = ({ rows, rangeLabel }: SpendingCategoryBreakdownProps) => {
  const { euro, pct1 } = useFormat();
  const spendings = useTranslations("spendings");
  const { breakdown: t } = spendings;
  const [selected, setSelected] = useState<BreakdownRow | null>(null);
  const [hover, setHover] = useState<BarHover<BreakdownRowWithTrend> | null>(null);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [hasStoredPref, setHasStoredPref] = useState(initialHasStoredPref);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    setHasStoredPref(true);
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  if (rows.length === 0) {
    return null;
  }

  // First-visit discoverability nudge: only until a choice is stored, and only
  // when there is hidden detail to reveal.
  const showHint = !hasStoredPref && collapsed;

  // One derived row per category carrying its trend badge — shared by the list
  // AND the hover tooltip so both render the identical badge (no recompute). The
  // badge stays hidden while the previous-week data is still loading
  // (`previousValue` undefined) rather than flashing a wrong "new" (COS-35).
  const trendLabels = { stable: t.trendStable, fresh: t.trendNew };
  const rowsWithTrend: BreakdownRowWithTrend[] = rows.map((r) => ({
    ...r,
    trend: r.previousValue === undefined ? undefined : categoryTrend(r.total, r.previousValue, trendLabels),
  }));

  const caret = (
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-expanded={!collapsed}
      aria-controls={DETAIL_ID}
      aria-label={collapsed ? t.expandAria : t.collapseAria}
      className="grid size-6 cursor-pointer place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-hi hover:text-ink"
    >
      <ChevronDown
        className={cn("size-4 transition-transform", !collapsed && "rotate-180")}
        aria-hidden
      />
    </button>
  );

  return (
    <GlowCard
      as="section"
      className="px-5.5 py-3.5"
    >
      {/* Compact margins (mb-3 / mb-2.5): this pane lives in the sticky zone,
          where height is taken directly from the day cards (COS-101). */}
      <CardSectionHeader
        className="mb-3"
        title={t.title}
        action={
          <div className="flex items-center gap-3 self-center">
            <span className="text-xs text-ink-4">
              {rangeLabel}
              {t.rangeSuffix}
            </span>
            {showHint ? (
              <Tooltip>
                <TooltipTrigger asChild>{caret}</TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                >
                  {t.expandHint}
                </TooltipContent>
              </Tooltip>
            ) : (
              caret
            )}
          </div>
        }
      />

      <div className="mb-2.5 flex h-2 overflow-hidden rounded-sm">
        {rowsWithTrend.map((r) => (
          <span
            key={r.key}
            role="img"
            className="block h-full"
            aria-label={`${r.name} : ${pct1(r.pct)} % (${euro(r.total)} €)`}
            style={{ width: `${r.pct.toFixed(2)}%`, background: r.color }}
            onMouseMove={(e) => setHover({ target: r, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>

      <div
        id={DETAIL_ID}
        className="grid grid-rows-[1fr] [transition:grid-template-rows_0.24s_ease,opacity_0.2s_ease] data-[collapsed=true]:grid-rows-[0fr] data-[collapsed=true]:opacity-0 motion-reduce:transition-none"
        data-collapsed={collapsed}
      >
        <div
          className="min-h-0 overflow-hidden"
          inert={collapsed}
        >
          {/* min(400px,100%) so a narrow phone gets ONE full-width column instead of a
              forced 400px track overflowing to the right. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))] gap-x-11 max-[520px]:grid-cols-1 max-[520px]:gap-x-0">
            {rowsWithTrend.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelected(r)}
                className="-mx-2 grid w-full cursor-pointer grid-cols-[14px_minmax(0,1fr)_76px_88px_60px] items-center gap-3 rounded-md border-b border-line-soft px-2 py-1.75 text-left text-sm transition-colors duration-100 hover:bg-surface-hi max-[520px]:grid-cols-[14px_minmax(0,1fr)_auto] max-[520px]:grid-rows-[auto_auto] max-[520px]:gap-x-2.5 max-[520px]:gap-y-0.75"
              >
                <span
                  className="size-2 rounded-xs max-[520px]:row-span-2 max-[520px]:row-start-1 max-[520px]:self-center"
                  style={{ background: r.color }}
                />
                <span className="flex min-w-0 items-baseline gap-2 max-[520px]:col-start-2 max-[520px]:row-start-1">
                  <span className="truncate capitalize text-ink">{r.name}</span>
                  <span className="num shrink-0 rounded-full border border-line-soft bg-surface-base px-1.75 text-2xs leading-normal text-ink-3">
                    {r.count}
                  </span>
                </span>
                <span className="num text-right text-ink-2 max-[520px]:col-start-2 max-[520px]:row-start-2 max-[520px]:justify-self-start max-[520px]:text-left">
                  {pct1(r.pct)} %
                </span>
                <span className="num text-right text-ink max-[520px]:col-start-3 max-[520px]:row-start-1 max-[520px]:justify-self-end">
                  {euro(r.total)} €
                </span>
                <span className="max-[520px]:col-start-3 max-[520px]:row-start-2 max-[520px]:justify-self-end">
                  {r.trend && <CategoryTrend {...r.trend} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hover && (
        <CategoryBarTooltip
          point={{ x: hover.x, y: hover.y }}
          datum={hover.target}
        />
      )}

      {selected && (
        <SpendingsListModal
          handleClickOutside={() => setSelected(null)}
          periodType={WEEKLY}
          categoryInfos={{
            value: selected.total,
            category: selected.category,
            categoryColor: selected.color,
          }}
          total={selected.total}
        />
      )}
    </GlowCard>
  );
};

export default SpendingCategoryBreakdown;
