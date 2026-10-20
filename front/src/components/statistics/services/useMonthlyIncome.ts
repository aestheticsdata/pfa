import { monthlyIncomeQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

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

  const { data, isPending } = useQuery(monthlyIncomeQuery(privateRequest, year));

  return { monthlyIncome: data?.income, isLoading: isPending };
};

export default useMonthlyIncome;
