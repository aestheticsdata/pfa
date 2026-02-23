import useRequestHelper from "@helpers/useRequestHelper";
import { useUserStore } from "@auth/store/userStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import startOfMonth from "date-fns/startOfMonth";
import useDashboard from "@components/spendings/services/useDashboard";
import { endOfMonth } from "date-fns";


const useWeeklyStats = () => {
  const { privateRequest } = useRequestHelper();
  const user = useUserStore((state) => state.user);
  const userID = user?.id;
  const { get: { data: dashboard } } = useDashboard();
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);
  const queryClient = useQueryClient();

  const getWeeklyStats = async () => {
    try {
      return privateRequest(`/weeklystats?userID=${userID}&start=${startOfMonth(from!)}`);
    } catch (e) {
      console.log("get weekly stats error : ", e);
    }
  };

  const setInitialCeiling = async (ceiling: string) => {
    try {
      return privateRequest(`/dashboard/${dashboard!.data.ID}`, {
        method: "PUT",
        data: {
          userID,
          ceiling,
          start: startOfMonth(from!),
          end: endOfMonth(from!),
        }
      })
    } catch (e) {
      console.log("error setting initial ceiling", e);
    }
  }

  const get = useQuery([QUERY_KEYS.WEEKLY_STATS, monthBeginning], getWeeklyStats, {
    retry: false,
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });

  const mutation = useMutation((ceiling: string) => setInitialCeiling(ceiling), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(["dashboard", startOfMonth(from!)]);
    }
  });

  return {
    get,
    mutation,
  }
}

export default useWeeklyStats;
