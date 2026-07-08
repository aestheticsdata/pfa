// MOCK — cross-week comparisons (this week vs last week) and per-category
// trend arrows need previous-period data the API does not expose yet.
// Values here are DETERMINISTIC (hashed from a stable key) so the UI stays
// stable between renders, but they are NOT real. To be replaced once the
// backend serves prior-period aggregates. See REFACTO_NOTES.md §6.

const hash = (input: string): number => {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

export type TrendDirection = "up" | "down" | "flat";

export interface CategoryTrend {
  direction: TrendDirection;
  label: string;
}

/**
 * MOCK average-per-day delta vs "last week", in euros (can be negative).
 * `key` should identify the week (e.g. the ISO start date).
 */
export const mockAvgDailyDelta = (key: string): number => {
  const h = hash(`avg:${key}`);
  return (h % 27) - 13; // roughly -13 … +13 €
};

/**
 * MOCK per-category trend vs "last week". Deterministic from the category name.
 */
export const mockCategoryTrend = (name: string): CategoryTrend => {
  const h = hash(`trend:${name.toLowerCase()}`);
  const bucket = h % 5;
  if (bucket === 0) {
    return { direction: "flat", label: "stable" };
  }
  if (bucket === 1) {
    return { direction: "flat", label: "nouv." };
  }
  const pct = 5 + (h % 40); // 5 … 44 %
  if (bucket === 2) {
    return { direction: "down", label: `−${pct}%` };
  }
  return { direction: "up", label: `+${pct}%` };
};
