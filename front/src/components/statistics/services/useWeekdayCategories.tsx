import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { WeekdayCategoriesResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";

import type { WeekdayCategoriesResponse } from "@src/schemas/stats";

interface UseWeekdayCategoriesOptions {
  year: number;
}

/**
 * Dominant spending category per weekday for the given year (COS-127). One
 * request per year, cached like the other stats queries. Feeds the day-of-week
 * widget's hover tooltip — the one field that isn't derivable from /daily-stats.
 */
const useWeekdayCategories = ({ year }: UseWeekdayCategoriesOptions) => {
  const { privateRequest } = useRequestHelper();

  const getWeekdayCategories = async (): Promise<WeekdayCategoriesResponse> => {
    const response = await privateRequest(`/weekday-categories?year=${year}`);
    return WeekdayCategoriesResponseSchema.parse(response.data);
  };

  const { data, isPending } = useQuery({
    queryKey: [QUERY_KEYS.WEEKDAY_CATEGORIES, year],
    queryFn: getWeekdayCategories,
    retry: false,
  });

  return { weekdayCategories: data, isLoading: isPending };
};

export default useWeekdayCategories;
