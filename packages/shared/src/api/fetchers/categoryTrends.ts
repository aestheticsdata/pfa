import type { CategoryTrendPoint } from "#schemas/stats";

const UNCATEGORIZED = "__uncategorized__";

/**
 * A user category and a global one can share a name: merge those rows by name, summing both
 * periods, then sort by the current amount, largest first. `previousValue` stays null (a "new"
 * category) only when every merged row had none.
 */
export const aggregateTrendsByCategory = (items: readonly CategoryTrendPoint[]) => {
  const byName = new Map<string, CategoryTrendPoint>();
  for (const item of items) {
    const key = item.category ?? UNCATEGORIZED;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, { ...item });
      continue;
    }
    existing.value += item.value;
    if (item.previousValue !== null) {
      existing.previousValue = (existing.previousValue ?? 0) + item.previousValue;
    }
  }
  return [...byName.values()].sort((a, b) => b.value - a.value);
};
