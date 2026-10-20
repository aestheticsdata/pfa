import { weekdayCategoriesQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

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

  const { data, isPending } = useQuery(weekdayCategoriesQuery(privateRequest, year));

  return { weekdayCategories: data, isLoading: isPending };
};

export default useWeekdayCategories;
