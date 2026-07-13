import { QUERY_OPTIONS } from "@components/spendings/config/constants";
import useCategories from "@components/spendings/services/useCategories";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { StatisticsResponseSchema } from "@src/schemas/stats";
import { useQuery } from "react-query";

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
  const queryKey = ["statistics", yearsParam, categoryIds.join(",")];

  const getStatistics = async (): Promise<StatisticsResponse> => {
    const response = await privateRequest(`/statistics?years=${yearsParam}&categories=${categoryIds.join(",")}`);
    return StatisticsResponseSchema.parse(response.data);
  };

  const { data, isLoading, error } = useQuery(queryKey, getStatistics, {
    retry: true,
    ...QUERY_OPTIONS,
    enabled: categoryIds.length > 0 && sortedYears.length > 0,
  });

  return {
    statistics: data,
    colors: data?.colors ?? {},
    categories: categories ?? [],
    isLoading,
    error,
  };
};

export default useStatistics;
