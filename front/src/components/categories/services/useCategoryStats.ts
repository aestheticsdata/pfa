import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { CategoryStatsResponseSchema } from "@src/schemas/categoryStats";
import { useQuery } from "@tanstack/react-query";

/** Inclusive calendar-date window (yyyy-MM-dd) to scope the aggregate. */
interface CategoryStatsRange {
  from: string;
  to: string;
}

/**
 * Usage aggregate per category (count of spendings + total spent). Without a
 * range it covers the whole history (Categories page); with one it scopes to
 * that window — the spending modal passes the current year to date so its
 * "Fréquentes" quick-picks rank on recent usage (COS-137). Each window is a
 * separate cache entry.
 */
const useCategoryStats = (range?: CategoryStatsRange) => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;

  const getCategoryStatsService = async () => {
    try {
      const query = range ? `?from=${range.from}&to=${range.to}` : "";
      const response = await privateRequest(`/category-stats${query}`);
      return CategoryStatsResponseSchema.parse(response.data);
    } catch (e) {
      console.log("get category stats error : ", e);
      throw e; // Re-throw pour que React Query gère l'erreur correctement
    }
  };

  const { data: categoryStats, error } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY_STATS, userID, range?.from ?? null, range?.to ?? null],
    queryFn: getCategoryStatsService,
    retry: 2,
    enabled: !!userID,
    ...QUERY_OPTIONS,
  });

  return { categoryStats, error };
};

export default useCategoryStats;
