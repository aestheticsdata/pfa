import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { DailyStatsResponseSchema } from "@src/schemas/stats";
import { keepPreviousData as keepPreviousDataFn, useQuery } from "@tanstack/react-query";

import type { DailyStatsResponse } from "@src/schemas/stats";

interface UseDailyStatsOptions {
  year: number;
  /** Gate the request — skips the compare-year fetch when comparison is off (COS-127). */
  enabled?: boolean;
  /** Keep the previous year's data while a new year loads, so a year switch doesn't
   *  flash undefined — used by the day-of-week compare series for a smooth swap. */
  keepPreviousData?: boolean;
}

/**
 * Per-day spending totals for the given year (COS-45). One request per year,
 * cached like the other stats queries. Feeds the daily heatmap and, later, the
 * day-of-week averages (COS-48) — both read the same daily series.
 */
const useDailyStats = ({ year, enabled = true, keepPreviousData = false }: UseDailyStatsOptions) => {
  const { privateRequest } = useRequestHelper();

  const getDailyStats = async (): Promise<DailyStatsResponse> => {
    const response = await privateRequest(`/daily-stats?year=${year}`);
    return DailyStatsResponseSchema.parse(response.data);
  };

  const { data, isPending, error } = useQuery({
    queryKey: [QUERY_KEYS.DAILY_STATS, year],
    queryFn: getDailyStats,
    retry: false,
    enabled,
    placeholderData: keepPreviousData ? keepPreviousDataFn : undefined,
    ...QUERY_OPTIONS,
  });

  return { dailyStats: data, isLoading: isPending, error };
};

export default useDailyStats;
