import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { weeklyStatsQuery } from "@components/spendings/services/queries";
import useDashboard from "@components/spendings/services/useDashboard";
import { monthStartIso } from "@helpers/dateRoute";
import useRequestHelper from "@helpers/useRequestHelper";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const useWeeklyStats = () => {
  const { privateRequest } = useRequestHelper();
  const {
    get: { data: dashboard },
  } = useDashboard();
  const from = useDatePickerWrapperStore((state) => state.from);
  const queryClient = useQueryClient();

  const setInitialCeiling = async (ceiling: string) => {
    if (!dashboard?.ID) {
      return null;
    }

    return privateRequest(`/dashboard/${dashboard.ID}`, {
      method: "PUT",
      data: {
        ceiling: Number(ceiling),
      },
    });
  };

  const get = useQuery(weeklyStatsQuery(privateRequest, monthStartIso(from)));

  const mutation = useMutation({
    mutationFn: (ceiling: string) => setInitialCeiling(ceiling),

    onSuccess: () => invalidateFamilies(queryClient, [QUERY_KEYS.DASHBOARD]),
  });

  return {
    get,
    mutation,
  };
};

export default useWeeklyStats;
