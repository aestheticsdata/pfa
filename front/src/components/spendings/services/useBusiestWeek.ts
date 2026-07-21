import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { BusiestWeekResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";

import type { BusiestWeekResponse } from "@src/schemas/stats";

/**
 * The displayed month's busiest calendar week-range by transaction count
 * (COS-139): the Sun→Sat slice (truncated at the month edges, like the rest of
 * the app) with the most one-off spendings, as `{ count, from, to }` — from/to
 * null when the month is empty. Backs the dashboard's 4th ribbon insight. The
 * month is passed as its 1st day; userID is read from the session server-side.
 */
const useBusiestWeek = () => {
  const { privateRequest } = useRequestHelper();
  const { from } = useDatePickerWrapperStore();
  const { user } = useAuth();
  const userID = user?.id;
  const monthBeginning = from ? startOfMonth(from) : null;

  const getBusiestWeek = async (): Promise<BusiestWeekResponse> => {
    if (!monthBeginning || !userID) return { count: 0, from: null, to: null };
    const query = new URLSearchParams({ start: format(monthBeginning, DATE_FORMAT) });
    const response = await privateRequest(`/busiest-week?${query}`);
    return BusiestWeekResponseSchema.parse(response.data);
  };

  return useQuery({
    queryKey: [QUERY_KEYS.BUSIEST_WEEK, monthBeginning],
    queryFn: getBusiestWeek,
    retry: false,
    enabled: !!monthBeginning && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useBusiestWeek;
