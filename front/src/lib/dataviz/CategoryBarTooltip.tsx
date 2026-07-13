"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CategoryTrend from "@lib/dataviz/CategoryTrend";

import type { CategoryTrendData } from "@lib/dataviz/CategoryTrend";

// Measure-then-position must run before paint to clamp the tooltip at the
// viewport edge without a flash; fall back to useEffect on the server, where
// layout effects warn (and never run) anyway.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const formatAmount = (amount: number) =>
  Number(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** One category's display data — mirrors its list row. */
export interface CategoryTooltipDatum {
  color: string;
  name: string;
  count: number;
  /** Share of the total, 0-100 (already computed — the tooltip only formats). */
  pct: number;
  /** Amount in euros. */
  total: number;
  /** Trend data — the page computes it from its own source (weekly vs monthly). */
  trend: CategoryTrendData;
}

export interface CategoryBarTooltipProps {
  /** Cursor position in viewport coords, or null when the tooltip is hidden. */
  point: { x: number; y: number } | null;
  datum: CategoryTooltipDatum;
}

/**
 * Mouse-following tooltip for a stacked category bar. Follows the cursor,
 * clamps inside the viewport, and mirrors the list row (swatch / name / count
 * / % / amount / trend). Shared by the Dépenses and Dashboard breakdowns.
 */
const CategoryBarTooltip = ({ point, datum }: CategoryBarTooltipProps) => {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Follow the cursor while clamping the floating tooltip inside the viewport.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!point || !el) {
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const GAP = 16;
    const EDGE = 12;
    let left = point.x + GAP;
    if (left + width + EDGE > window.innerWidth) {
      left = point.x - GAP - width;
    }
    let top = point.y + GAP;
    if (top + height + EDGE > window.innerHeight) {
      top = point.y - GAP - height;
    }
    setPos({
      left: Math.max(EDGE, left),
      top: Math.max(EDGE, top),
    });
  }, [point]);

  if (!point) {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      className="cat-tooltip"
      style={{
        // Layout-critical → inline so the portaled tooltip stays out of normal
        // flow even if the .cat-tooltip stylesheet is missing/stale.
        position: "fixed",
        zIndex: 60,
        pointerEvents: "none",
        left: pos ? pos.left : point.x + 16,
        top: pos ? pos.top : point.y + 16,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-[2px]"
          style={{ background: datum.color }}
        />
        <span className="truncate text-[13px] font-medium capitalize text-ink">
          {datum.name}
        </span>
        <span className="num ml-auto shrink-0 rounded-full border border-line-soft bg-background px-[7px] text-[10.5px] leading-[1.55] text-ink-3">
          {datum.count}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-1 text-[12px]">
        <span className="text-ink-4">Part</span>
        <span className="num text-right text-ink-2">
          {datum.pct.toFixed(1).replace(".", ",")} %
        </span>
        <span className="text-ink-4">Montant</span>
        <span className="num text-right text-ink">
          {formatAmount(datum.total)} €
        </span>
        <span className="text-ink-4">Tendance</span>
        <CategoryTrend {...datum.trend} />
      </div>
    </div>,
    document.body,
  );
};

export default CategoryBarTooltip;
