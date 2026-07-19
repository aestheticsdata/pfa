import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { MonthlyIncomeResponseSchema } from "@src/schemas/dashboard";
import { useQuery } from "react-query";

import type { MonthlyIncomeResponse } from "@src/schemas/dashboard";

interface UseMonthlyIncomeOptions {
  year: number;
}

/**
 * Per-month income (dashboard `initialAmount`) for the given year (COS-50),
 * backing the monthly chart's stepped budget line. Months with no dashboard row
 * come back null; the chart carries the last known value forward.
 */
const useMonthlyIncome = ({ year }: UseMonthlyIncomeOptions) => {
  const { privateRequest } = useRequestHelper();

  const getMonthlyIncome = async (): Promise<MonthlyIncomeResponse> => {
    const response = await privateRequest(`/dashboard/monthly-income?year=${year}`);
    return MonthlyIncomeResponseSchema.parse(response.data);
  };

  const { data, isLoading, error } = useQuery([QUERY_KEYS.MONTHLY_INCOME, year], getMonthlyIncome, {
    retry: false,
    ...QUERY_OPTIONS,
  });

  return { monthlyIncome: data?.income, isLoading, error };
};

export default useMonthlyIncome;
