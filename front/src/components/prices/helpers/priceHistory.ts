import { parseISO } from "date-fns";

import type { HistoryPoint, PixelPoint } from "@components/prices/interfaces/pricesTypes";
import type { BasisComparison } from "@src/schemas/prices";

/**
 * The series hues, in their fixed order (validated palette, `--series-*`
 * tokens). Never cycled: stores past the last hue are left off the chart.
 */
export const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
];

const DAY_MS = 86_400_000;
// Room above and below the lines, as a share of the price range.
const DOMAIN_PAD = 0.12;

/**
 * Each store's hue for a product type (PFA-222): stores in name order, so a
 * store keeps its colour on every basis and whatever the ranking.
 */
export const storeColors = (comparisons: BasisComparison[]) => {
  const stores = new Map<string, string>();
  for (const comparison of comparisons) {
    for (const store of comparison.stores) stores.set(store.storeID, store.name);
  }
  const ordered = [...stores.entries()].sort(([idA, a], [idB, b]) => a.localeCompare(b) || idA.localeCompare(idB));
  return new Map(ordered.slice(0, SERIES_COLORS.length).map(([storeID], i) => [storeID, SERIES_COLORS[i]]));
};

/** The calendar day a chart x stands for. */
export const dayToDate = (day: number) => new Date(day * DAY_MS);

/** A history is worth a chart once some store was bought from more than once. */
export const hasHistory = (comparison: BasisComparison) => comparison.stores.some((store) => store.history.length > 1);

/** Every coloured store's purchases, as chart points. */
export const historyPoints = (comparison: BasisComparison, colors: Map<string, string>): HistoryPoint[] =>
  comparison.stores.flatMap((store) => {
    const color = colors.get(store.storeID);
    if (!color) return [];
    return store.history.map((point) => ({
      storeID: store.storeID,
      storeName: store.name,
      color,
      day: Math.round(parseISO(point.date).getTime() / DAY_MS),
      date: point.date,
      unitPrice: point.unitPrice,
      amount: point.amount,
      quantity: point.quantity,
      size: point.size,
      sizeUnit: point.sizeUnit,
    }));
  });

/** The price axis: the prices seen, with some room; a flat price still gets a span. */
export const priceDomain = (prices: number[]): [number, number] => {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = max > min ? (max - min) * DOMAIN_PAD : Math.max(min * DOMAIN_PAD, 0.5);
  return [Math.max(0, min - pad), max + pad];
};

/** The index of the point nearest the cursor within `reach` pixels, else null. */
export const nearestPoint = (points: PixelPoint[], cursor: PixelPoint, reach: number) => {
  let bestIndex: number | null = null;
  let bestDistance = reach;
  for (const [index, point] of points.entries()) {
    const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
    if (distance <= reach && (bestIndex === null || distance < bestDistance)) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
};
