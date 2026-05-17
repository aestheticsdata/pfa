import { useQuery } from "react-query";
import { z } from "zod";
import useRequestHelper from "@helpers/useRequestHelper";
import { useAuth } from "@auth/context/AuthContext";
import { QUERY_OPTIONS } from "@components/spendings/config/constants";

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

  return useQuery(["regularMonthlyAverage", year], fetcher, {
    retry: false,
    enabled: !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useRegularMonthlyAverage;
