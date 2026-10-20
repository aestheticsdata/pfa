import { dailyStatsQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { keepPreviousData as keepPreviousDataFn, useQuery } from "@tanstack/react-query";

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

  const { data, isPending } = useQuery({
    ...dailyStatsQuery(privateRequest, year),
    enabled,
    placeholderData: keepPreviousData ? keepPreviousDataFn : undefined,
  });

  return { dailyStats: data, isLoading: isPending };
};

export default useDailyStats;
