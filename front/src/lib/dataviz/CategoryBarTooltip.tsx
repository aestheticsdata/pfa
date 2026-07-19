"use client";

import CategoryTrend from "@lib/dataviz/CategoryTrend";
import { euro } from "@lib/format";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { CategoryTrendData } from "@lib/dataviz/CategoryTrend";

// Measure-then-position must run before paint to clamp the tooltip at the
// viewport edge without a flash; fall back to useEffect on the server, where
// layout effects warn (and never run) anyway.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** One category's display data — mirrors its list row. */
export interface CategoryTooltipDatum {
  color: string;
  name: string;
  /** Item count pill. Omit for data that has no count (e.g. the budget donut's
   *  Fixes / Variables segments) — the pill is then hidden. */
  count?: number;
  /** Share of the total, 0-100 (already computed — the tooltip only formats). */
  pct: number;
  /** Amount in euros. */
  total: number;
  /** Trend data — the page computes it from its own source (weekly vs monthly).
   *  Omit for data with no trend — the "Tendance" row is then hidden. */
  trend?: CategoryTrendData;
}

export interface CategoryBarTooltipProps {
  /** Cursor position in viewport coords, or null when the tooltip is hidden. */
  point: { x: number; y: number } | null;
  datum: CategoryTooltipDatum;
}

/**
 * Local hover state a consumer keeps to drive this tooltip: viewport coords
 * plus the hovered target. `T` is whatever resolves the datum — the row object
 * itself, or its index into a rows array.
 */
export interface BarHover<T> {
  /** Cursor X in viewport coords (clientX). */
  x: number;
  /** Cursor Y in viewport coords (clientY). */
  y: number;
  /** The hovered target (a row, an index, …). */
  target: T;
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
      style={{
        // This tooltip is portaled to document.body, so its whole skin is inline
        // (not a `.cat-tooltip` class): a portaled element can't rely on an
        // external rule resolving there — that class not applying left it
        // see-through over the list (COS-76 QA). Theme vars keep a literal
        // fallback; ~92% opacity for a very light, readable transparency.
        position: "fixed",
        zIndex: 60,
        pointerEvents: "none",
        left: pos ? pos.left : point.x + 16,
        top: pos ? pos.top : point.y + 16,
        minWidth: 172,
        maxWidth: 240,
        padding: "10px 12px",
        background: "color-mix(in oklch, var(--surface-elev, oklch(0.185 0.006 250)) 92%, transparent)",
        border: "1px solid var(--line, oklch(0.27 0.008 250))",
        borderRadius: "var(--r-md, 10px)",
        boxShadow: "0 16px 40px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-xs"
          style={{ background: datum.color }}
        />
        <span className="truncate text-sm font-medium capitalize text-ink">{datum.name}</span>
        {datum.count != null && (
          <span className="num ml-auto shrink-0 rounded-full border border-line-soft bg-surface-base px-2 text-2xs leading-normal text-ink-3">
            {datum.count}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-1 text-xs">
        <span className="text-ink-4">Part</span>
        <span className="num text-right text-ink-2">{datum.pct.toFixed(1).replace(".", ",")} %</span>
        <span className="text-ink-4">Montant</span>
        <span className="num text-right text-ink">{euro(datum.total)} €</span>
        {datum.trend && (
          <>
            <span className="text-ink-4">Tendance</span>
            <CategoryTrend {...datum.trend} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default CategoryBarTooltip;
