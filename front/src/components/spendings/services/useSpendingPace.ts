import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { SpendingPaceResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";

import type { SpendingPaceResponse } from "@src/schemas/stats";

/**
 * The totals of the three months before the displayed month (COS-40), newest→
 * oldest, as `{ months: [{ month, total }] }`. Backs the dashboard's "Sur le
 * rythme" insight, which turns them into daily rates to gauge the current month's
 * pace. The month is passed as its 1st day; userID is read from the session
 * server-side.
 */
const useSpendingPace = () => {
  const { privateRequest } = useRequestHelper();
  const { from } = useDatePickerWrapperStore();
  const { user } = useAuth();
  const userID = user?.id;
  const monthBeginning = from ? startOfMonth(from) : null;

  const getSpendingPace = async (): Promise<SpendingPaceResponse> => {
    if (!monthBeginning || !userID) return { months: [] };
    const query = new URLSearchParams({ start: format(monthBeginning, DATE_FORMAT) });
    const response = await privateRequest(`/spending-pace?${query}`);
    return SpendingPaceResponseSchema.parse(response.data);
  };

  return useQuery({
    queryKey: [QUERY_KEYS.SPENDING_PACE, monthBeginning],
    queryFn: getSpendingPace,
    retry: false,
    enabled: !!monthBeginning && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useSpendingPace;
