import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { BiggestRegularExpenseResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";

import type { BiggestRegularExpenseResponse } from "@src/schemas/stats";

interface UseBiggestRegularExpenseOptions {
  year: number;
}

/**
 * The biggest single one-off (non-exceptional) expense of the given year
 * (COS-46). One request per year, cached like the other stats queries. Feeds the
 * "courante" row of the "Plus grosse dépense" KPI card.
 */
const useBiggestRegularExpense = ({ year }: UseBiggestRegularExpenseOptions) => {
  const { privateRequest } = useRequestHelper();

  const getBiggestRegularExpense = async (): Promise<BiggestRegularExpenseResponse> => {
    const response = await privateRequest(`/biggest-regular-expense?year=${year}`);
    return BiggestRegularExpenseResponseSchema.parse(response.data);
  };

  const { data, isPending } = useQuery({
    queryKey: [QUERY_KEYS.BIGGEST_REGULAR_EXPENSE, year],
    queryFn: getBiggestRegularExpense,
    retry: false,
  });

  return { biggestRegular: data?.expense ?? null, isLoading: isPending };
};

export default useBiggestRegularExpense;
