import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { dailyProjectionQuery } from "@components/spendings/services/queries";
import { monthStartIso } from "@helpers/dateRoute";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";
import { isSameMonth } from "date-fns";

import type { DailyProjection } from "@src/schemas/dashboard";
import type { UseQueryResult } from "@tanstack/react-query";

// Reference-period data backing the sparkline's projected tail (COS-27). The
// projection only applies to the in-progress current month — past/complete
// months already fill the whole axis with real data — so the query is gated to
// that case and stays idle (never fetched) while browsing history.
const useDailyProjection = (): UseQueryResult<DailyProjection> => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  const isCurrentMonth = !!from && isSameMonth(from, new Date());
  const query = dailyProjectionQuery(privateRequest, monthStartIso(from));
  return useQuery({ ...query, enabled: query.enabled && isCurrentMonth });
};

export default useDailyProjection;
