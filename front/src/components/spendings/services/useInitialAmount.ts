import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { MonthlyStatsSchema } from "@src/schemas/dashboard";
import startOfMonth from "date-fns/startOfMonth";
import { useQuery } from "react-query";

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

  return useQuery([QUERY_KEYS.INITIAL_AMOUNT, monthBeginning], getInitialAmount, {
    retry: false,
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useInitialAmount;
