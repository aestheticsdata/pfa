import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { RegularMonthlyAverageSchema } from "@src/schemas/exceptionals";
import { parseResponse } from "@src/schemas/parseResponse";
import { useQuery } from "@tanstack/react-query";

import type { RegularMonthlyAverage } from "@src/schemas/exceptionals";

const useRegularMonthlyAverage = (year: number) => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;

  const fetcher = async (): Promise<RegularMonthlyAverage> => {
    const response = await privateRequest(`/regular-monthly-average?year=${year}`);
    return parseResponse(RegularMonthlyAverageSchema, response.data, "/regular-monthly-average");
  };

  return useQuery({
    queryKey: [QUERY_KEYS.REGULAR_MONTHLY_AVERAGE, year],
    queryFn: fetcher,
    retry: false,
    enabled: !!userID,
  });
};

export default useRegularMonthlyAverage;
