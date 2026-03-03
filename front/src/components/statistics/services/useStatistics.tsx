import { useQuery } from "react-query";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { QUERY_OPTIONS } from "@components/spendings/config/constants";
import { StatisticsResponseSchema } from "@src/schemas/stats";

import type { StatisticsResponse } from "@src/schemas/stats";
import type { Category } from "@src/schemas/categories";

interface SelectOption {
  value: number;
  label: number;
}

const generateYearRange = (startYear: number) => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year: number = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  return years.join(',');
}

const useStatistics = (
  categories: Category[] = [],
  yearSelectorWatcher?: SelectOption,
) => {
  const { privateRequest } = useRequestHelper();
  const queryKey = ['statistics', yearSelectorWatcher?.value ?? "", ...(categories?.map((category) => category.ID) ?? [])];

  const getStatistics = async (): Promise<StatisticsResponse> => {
    const categoryIds = categories.map((category) => category.ID).join(',');
    const response = await privateRequest(`/statistics?years=${generateYearRange(yearSelectorWatcher?.value ?? new Date().getFullYear())}&categories=${categoryIds}`);
    return StatisticsResponseSchema.parse(response.data);
  };

  const { data: statistics, isLoading, error } = useQuery(
    queryKey,
    getStatistics,
    {
      retry: true,
      ...QUERY_OPTIONS,
      enabled: categories.length > 0 && !!yearSelectorWatcher,
    });

  return {
    isLoading,
    statistics,
    error,
  }
}

export default useStatistics;
