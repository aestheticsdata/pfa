import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { CategoryStatsResponseSchema } from "@src/schemas/categoryStats";
import { useQuery } from "react-query";

/** All-time usage aggregate per category (count of spendings + total spent). */
const useCategoryStats = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;

  const getCategoryStatsService = async () => {
    try {
      const response = await privateRequest("/category-stats");
      return CategoryStatsResponseSchema.parse(response.data);
    } catch (e) {
      console.log("get category stats error : ", e);
      throw e; // Re-throw pour que React Query gère l'erreur correctement
    }
  };

  const { data: categoryStats, error } = useQuery([QUERY_KEYS.CATEGORY_STATS, userID], getCategoryStatsService, {
    retry: 2,
    enabled: !!userID,
    ...QUERY_OPTIONS,
  });

  return { categoryStats, error };
};

export default useCategoryStats;
