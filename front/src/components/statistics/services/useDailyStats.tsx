import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { DailyStatsResponseSchema } from "@src/schemas/stats";
import { useQuery } from "react-query";

import type { DailyStatsResponse } from "@src/schemas/stats";

interface UseDailyStatsOptions {
  year: number;
}

/**
 * Per-day spending totals for the given year (COS-45). One request per year,
 * cached like the other stats queries. Feeds the daily heatmap and, later, the
 * day-of-week averages (COS-48) — both read the same daily series.
 */
const useDailyStats = ({ year }: UseDailyStatsOptions) => {
  const { privateRequest } = useRequestHelper();

  const getDailyStats = async (): Promise<DailyStatsResponse> => {
    const response = await privateRequest(`/daily-stats?year=${year}`);
    return DailyStatsResponseSchema.parse(response.data);
  };

  const { data, isLoading, error } = useQuery([QUERY_KEYS.DAILY_STATS, year], getDailyStats, {
    retry: false,
    ...QUERY_OPTIONS,
  });

  return { dailyStats: data, isLoading, error };
};

export default useDailyStats;
