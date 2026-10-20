import { biggestRegularExpenseQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

interface UseBiggestRegularExpenseOptions {
  year: number;
}

/**
 * The biggest single one-off (non-exceptional) expense of the given year
 * (COS-46). One request per year, cached like the other stats queries. Feeds the
 * "regular" row of the "Biggest expense" KPI card.
 */
const useBiggestRegularExpense = ({ year }: UseBiggestRegularExpenseOptions) => {
  const { privateRequest } = useRequestHelper();

  const { data, isPending } = useQuery(biggestRegularExpenseQuery(privateRequest, year));

  return { biggestRegular: data?.expense ?? null, isLoading: isPending };
};

export default useBiggestRegularExpense;
