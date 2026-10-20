import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { monthlyStatsQuery } from "@components/spendings/services/queries";
import { monthStartIso } from "@helpers/dateRoute";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/**
 * The displayed month's spendings and fixed-expenses totals. Named after what it
 * reads: it used to feed the dashboard's "initial amount" (the month's income),
 * which comes from `useDashboard` — the name outlived the data (COS-179).
 */
const useMonthlyStats = () => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  return useQuery(monthlyStatsQuery(privateRequest, monthStartIso(from)));
};

export default useMonthlyStats;
