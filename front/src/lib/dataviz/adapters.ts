// Thin mappers from the project's real API shapes onto the generic dataviz
// contracts — so the lib stays reusable but ergonomic for pfa data.

import type { BarDatum, DonutSegment } from "@lib/dataviz/dataVizTypes";
import type { ChartsCategory } from "@src/schemas/stats";

const FALLBACK_COLOR = "#94a3b8";

export const categoriesToSegments = (categories: ChartsCategory[]): DonutSegment[] =>
  categories.map((c) => ({
    label: c.category ?? "sans catégorie",
    value: c.value,
    color: c.categoryColor ?? FALLBACK_COLOR,
  }));

export const categoriesToBars = (categories: ChartsCategory[]): BarDatum[] =>
  categories.map((c) => ({
    label: c.category ?? "sans catégorie",
    value: c.value,
    color: c.categoryColor ?? FALLBACK_COLOR,
  }));

export const weeklyTotalsToBars = (weekly: number[], color = "var(--accent-strong)"): BarDatum[] =>
  weekly.map((value, i) => ({ label: `S${i + 1}`, value, color }));
