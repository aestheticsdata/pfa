import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { WeeklyStatsSchema } from "@src/schemas/dashboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";

const useWeeklyStats = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const {
    get: { data: dashboard },
  } = useDashboard();
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);
  const queryClient = useQueryClient();

  const getWeeklyStats = async () => {
    const response = await privateRequest(`/weeklystats?userID=${userID}&start=${startOfMonth(from!)}`);
    return WeeklyStatsSchema.parse(response.data);
  };

  const setInitialCeiling = async (ceiling: string) => {
    if (!dashboard?.ID) {
      return null;
    }

    try {
      return privateRequest(`/dashboard/${dashboard.ID}`, {
        method: "PUT",
        data: {
          userID,
          ceiling: Number(ceiling),
          start: startOfMonth(from!),
          end: endOfMonth(from!),
        },
      });
    } catch (e) {
      console.log("error setting initial ceiling", e);
    }
  };

  const get = useQuery({
    queryKey: [QUERY_KEYS.WEEKLY_STATS, monthBeginning],
    queryFn: getWeeklyStats,
    retry: false,
    enabled: !!from && !!userID,
  });

  const mutation = useMutation({
    mutationFn: (ceiling: string) => setInitialCeiling(ceiling),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD, startOfMonth(from!)],
      });
    },
  });

  return {
    get,
    mutation,
  };
};

export default useWeeklyStats;
