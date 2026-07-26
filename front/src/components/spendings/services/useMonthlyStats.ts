import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { MonthlyStatsSchema } from "@src/schemas/dashboard";
import { useQuery } from "@tanstack/react-query";
import startOfMonth from "date-fns/startOfMonth";

/**
 * The displayed month's spendings and fixed-expenses totals. Named after what it
 * reads: it used to feed the dashboard's "initial amount" (the month's income),
 * which comes from `useDashboard` — the name outlived the data (COS-179).
 */
const useMonthlyStats = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = from ? startOfMonth(from) : null;

  const getMonthlyStats = async () => {
    if (!from || !userID) {
      throw new Error("Missing date range or user for monthlystats query");
    }

    try {
      const monthlyStats = await privateRequest(`/monthlystats?userID=${userID}&from=${startOfMonth(from)}`);
      return MonthlyStatsSchema.parse(monthlyStats.data);
    } catch (e) {
      console.log("get monthly stats error : ", e);
      throw e;
    }
  };

  return useQuery({
    queryKey: [QUERY_KEYS.MONTHLY_STATS, monthBeginning],
    queryFn: getMonthlyStats,
    retry: false,
    enabled: !!from && !!userID,
  });
};

export default useMonthlyStats;
