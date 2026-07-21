import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const RegularMonthlyAverageSchema = z.object({
  monthlyAverage: z.number(),
});

export type RegularMonthlyAverage = z.infer<typeof RegularMonthlyAverageSchema>;

const useRegularMonthlyAverage = (year: number) => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;

  const fetcher = async (): Promise<RegularMonthlyAverage> => {
    const response = await privateRequest(`/regular-monthly-average?year=${year}`);
    return RegularMonthlyAverageSchema.parse(response.data);
  };

  return useQuery({
    queryKey: [QUERY_KEYS.REGULAR_MONTHLY_AVERAGE, year],
    queryFn: fetcher,
    retry: false,
    enabled: !!userID,
  });
};

export default useRegularMonthlyAverage;
