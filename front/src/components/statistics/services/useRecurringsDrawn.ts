import { recurringsDrawnQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

interface UseRecurringsDrawnOptions {
  year: number;
  // Current month index (0 = January … 11 = December), from the client's "today".
  month: number;
}

/**
 * Real year-to-date "already debited" (COS-49): the sum of the actual per-month
 * recurring rows from January through the client's current month, computed
 * server-side (GET /recurrings/drawn). Replaces the old calendar estimate that
 * projected the current month's list backward from a `dateFrom` charge-day proxy.
 */
const useRecurringsDrawn = ({ year, month }: UseRecurringsDrawnOptions) => {
  const { privateRequest } = useRequestHelper();

  const { data, isPending } = useQuery(recurringsDrawnQuery(privateRequest, { year, month }));

  return { drawn: data?.drawn, isLoading: isPending };
};

export default useRecurringsDrawn;
