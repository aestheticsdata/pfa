import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { CategoryStat } from "@src/schemas/categoryStats";

export const FREQUENT_LIMIT = 6;

/**
 * Ranks the "Frequent" quick-picks by real all-time usage (COS-20's
 * per-category aggregate) and keeps only categories the user has actually
 * used. Ordering: number of spendings attached (desc), then total amount
 * spent (desc), then name (asc) as a deterministic tie-break. Never-used
 * categories are excluded, so the section stays empty until there is real
 * usage to rank. Returns at most `limit` options.
 */
export const rankFrequentCategories = (
  categories: CategoryOption[],
  byCategory: CategoryStat[] | undefined,
  limit = FREQUENT_LIMIT,
): CategoryOption[] => {
  const statsByID = new Map((byCategory ?? []).map((s) => [s.categoryID, s]));
  const statOf = (c: CategoryOption) => (c.ID ? statsByID.get(c.ID) : undefined);

  return [...categories]
    .filter((c) => c.name && (statOf(c)?.count ?? 0) > 0)
    .sort((a, b) => {
      const sa = statOf(a);
      const sb = statOf(b);
      const byCount = (sb?.count ?? 0) - (sa?.count ?? 0);
      if (byCount !== 0) return byCount;
      const byTotal = (sb?.total ?? 0) - (sa?.total ?? 0);
      if (byTotal !== 0) return byTotal;
      return a.name.localeCompare(b.name, "fr");
    })
    .slice(0, limit);
};
