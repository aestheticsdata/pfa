import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { RecurringsDrawnSchema } from "@src/schemas/spendings";
import { useQuery } from "@tanstack/react-query";

interface UseRecurringsDrawnOptions {
  year: number;
  // Current month index (0 = January … 11 = December), from the client's "today".
  month: number;
}

/**
 * Real year-to-date "déjà prélevé" (COS-49): the sum of the actual per-month
 * recurring rows from January through the client's current month, computed
 * server-side (GET /recurrings/drawn). Replaces the old calendar estimate that
 * projected the current month's list backward from a `dateFrom` charge-day proxy.
 */
const useRecurringsDrawn = ({ year, month }: UseRecurringsDrawnOptions) => {
  const { privateRequest } = useRequestHelper();

  const getDrawn = async () => {
    const response = await privateRequest(`/recurrings/drawn?year=${year}&month=${month}`);
    return RecurringsDrawnSchema.parse(response.data);
  };

  const { data, isPending, error } = useQuery({
    queryKey: [QUERY_KEYS.RECURRINGS_DRAWN, year, month],
    queryFn: getDrawn,
    retry: false,
    ...QUERY_OPTIONS,
  });

  return { drawn: data?.drawn, isLoading: isPending, error };
};

export default useRecurringsDrawn;
