import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { DailyProjectionSchema } from "@src/schemas/dashboard";
import { useQuery } from "@tanstack/react-query";
import formatISO from "date-fns/formatISO";
import isSameMonth from "date-fns/isSameMonth";
import startOfMonth from "date-fns/startOfMonth";

import type { DailyProjection } from "@src/schemas/dashboard";
import type { UseQueryResult } from "@tanstack/react-query";

// Reference-period data backing the sparkline's projected tail (COS-27). The
// projection only applies to the in-progress current month — past/complete
// months already fill the whole axis with real data — so the query is gated to
// that case and stays idle (never fetched) while browsing history. `start` is
// sent as a clean ISO date so the backend's UTC month arithmetic is tz-safe.
const useDailyProjection = (): UseQueryResult<DailyProjection> => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();

  const isCurrentMonth = !!from && isSameMonth(from, new Date());
  const monthBeginning = from ? startOfMonth(from) : undefined;
  // Only read once the query is enabled (which requires `from`); undefined here
  // is unreachable at fetch time but keeps the URL free of a non-null assertion.
  const start = monthBeginning ? formatISO(monthBeginning, { representation: "date" }) : undefined;

  const getDailyProjection = async () => {
    const response = await privateRequest(`/dashboard/projection?userID=${userID}&start=${start}`);
    return DailyProjectionSchema.parse(response.data);
  };

  return useQuery({
    queryKey: [QUERY_KEYS.DAILY_PROJECTION, monthBeginning],
    queryFn: getDailyProjection,
    retry: false,
    enabled: isCurrentMonth && !!userID,
  });
};

export default useDailyProjection;
