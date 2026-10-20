import { categoryStatsQuery } from "@components/categories/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

import type { DateBounds } from "@components/spendings/interfaces/spendingQueryTypes";

/**
 * Usage aggregate per category (count of spendings + total spent). Without a
 * range it covers the whole history (Categories page); with one it scopes to
 * that window — the spending modal passes the current year to date so its
 * "Frequent" quick-picks rank on recent usage (COS-137). Each window is a
 * separate cache entry.
 */
const useCategoryStats = (range?: DateBounds) => {
  const { privateRequest } = useRequestHelper();

  const { data: categoryStats, error } = useQuery(categoryStatsQuery(privateRequest, range));

  return { categoryStats, error };
};

export default useCategoryStats;
