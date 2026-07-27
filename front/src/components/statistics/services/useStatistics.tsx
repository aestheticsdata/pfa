import useCategories from "@components/spendings/services/useCategories";
import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { StatisticsResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";

import type { StatisticsResponse } from "@src/schemas/stats";

interface UseStatisticsOptions {
  years: number[];
}

/**
 * Fetches per-category monthly totals for the given years, across ALL of the
 * user's categories in one request. The page derives every figure (totals,
 * per-category series, year-over-year trends) from this single response, so the
 * category picker filters client-side with no refetch.
 */
const useStatistics = ({ years }: UseStatisticsOptions) => {
  const { privateRequest } = useRequestHelper();
  const { categories } = useCategories();
  const categoryIds = (categories ?? []).map((category) => category.ID);

  const sortedYears = [...years].sort((a, b) => a - b);
  const yearsParam = sortedYears.join(",");
  const queryKey = [QUERY_KEYS.STATISTICS, yearsParam, categoryIds.join(",")];

  const getStatistics = async (): Promise<StatisticsResponse> => {
    const response = await privateRequest(`/statistics?years=${yearsParam}&categories=${categoryIds.join(",")}`);
    return StatisticsResponseSchema.parse(response.data);
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: getStatistics,
    retry: true,
    enabled: categoryIds.length > 0 && sortedYears.length > 0,
  });

  return {
    statistics: data,
    colors: data?.colors ?? {},
    categories: categories ?? [],
    // The query is gated on the category list (it feeds the `categories` param),
    // so it sits idle — which React Query reports as "not loading" — until the
    // categories land: hence the explicit first leg. An account with zero
    // categories has nothing to fetch and resolves to `false`, never to an
    // endless loading state.
    isLoading: categories === undefined || isLoading,
  };
};

export default useStatistics;
