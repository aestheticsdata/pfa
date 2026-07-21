import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { MonthlyStatsSchema } from "@src/schemas/dashboard";
import { useQuery } from "@tanstack/react-query";
import startOfMonth from "date-fns/startOfMonth";

const useInitialAmount = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = from ? startOfMonth(from) : null;

  const getInitialAmount = async () => {
    if (!from || !userID) {
      throw new Error("Missing date range or user for monthlystats query");
    }

    try {
      const monthlyStats = await privateRequest(`/monthlystats?userID=${userID}&from=${startOfMonth(from)}`);
      return MonthlyStatsSchema.parse(monthlyStats.data);
    } catch (e) {
      console.log("get initial amount error : ", e);
      throw e;
    }
  };

  return useQuery({
    queryKey: [QUERY_KEYS.INITIAL_AMOUNT, monthBeginning],
    queryFn: getInitialAmount,
    retry: false,
    enabled: !!from && !!userID,
  });
};

export default useInitialAmount;
