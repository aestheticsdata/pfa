"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@lib/utils";

export type TrendDirection = "up" | "down" | "flat";

export interface CategoryTrendData {
  direction: TrendDirection;
  label: string;
}

/**
 * Per-category trend badge (arrow + % / label). Shared by the Dépenses and
 * Dashboard breakdowns and their hover tooltips, so the trend renders
 * identically everywhere. Colours: hausse = rouge, baisse = vert,
 * stable/nouv. = gris. Pure presentation — the caller computes
 * `direction`/`label` from its own source (weekly vs monthly).
 */
const CategoryTrend = ({ direction, label }: CategoryTrendData) => (
  <span
    className={cn(
      "num flex items-center justify-end gap-1 text-[11.5px]",
      direction === "up" && "text-neg",
      direction === "down" && "text-accent-strong",
      direction === "flat" && "text-ink-4",
    )}
  >
    {direction === "up" && <ArrowUp className="size-2.5" />}
    {direction === "down" && <ArrowDown className="size-2.5" />}
    {label}
  </span>
);

export default CategoryTrend;
