import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useMonthlyStats from "@components/spendings/services/useMonthlyStats";
import { formatIsoDate } from "@helpers/dateRoute";
import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { DashboardResponseSchema } from "@src/schemas/dashboard";
import { parseResponse } from "@src/schemas/parseResponse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, startOfMonth } from "date-fns";

import type { ApiError } from "@helpers/http";
import type { DashboardResponse } from "@src/schemas/dashboard";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

interface UseDashboard {
  get: UseQueryResult<DashboardResponse>;
  mutation: UseMutationResult<unknown, ApiError, DashboardMutationVariables>;
  remaining: number;
  monthlyTotal: number;
}

interface DashboardMutationVariables {
  dashboardID?: string;
  initialAmount: string;
}

/**
 * A month's dashboard: the month the date picker is on — or `month`, for a page with no picker.
 * The statistics page asks for the current month's, whose weekly ceiling its weekday chart is
 * drawn against: the picker's store is not persisted, so on a page opened directly it is empty,
 * and a dashboard read from it would never load.
 */
const useDashboard = (month?: Date): UseDashboard => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const pickerFrom = useDatePickerWrapperStore((state) => state.from);
  const from = month ?? pickerFrom;
  const monthBeginning = from ? startOfMonth(from) : null;
  const queryClient = useQueryClient();
  const { data: monthlyStats } = useMonthlyStats();

  const getDashboard = async () => {
    if (!monthBeginning) throw new Error("No month selected");
    const response = await privateRequest(`/dashboard?start=${formatIsoDate(monthBeginning)}`);
    return parseResponse(DashboardResponseSchema, response.data, "/dashboard");
  };

  const setInitialSalary = async (amount: string) => {
    if (!monthBeginning) throw new Error("No month selected");
    return privateRequest("/dashboard", {
      method: "POST",
      data: {
        amount: Number(amount),
        start: formatIsoDate(monthBeginning),
        end: formatIsoDate(endOfMonth(monthBeginning)),
      },
    });
  };

  const updateInitialSalary = async (dashboardID: string, amount: string) => {
    return privateRequest(`/dashboard/${dashboardID}`, {
      method: "PUT",
      data: {
        amount: Number(amount),
      },
    });
  };

  const get = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD, monthBeginning],
    queryFn: getDashboard,
    retry: false,
    enabled: !!from && !!userID,
  });

  const totalOfMonth = get.data && monthlyStats ? monthlyStats.spendingsSum + monthlyStats.recurringsSum : 0;
  const monthlyTotal = Number(totalOfMonth.toFixed(2));
  const remaining = get.data ? Number((get.data.initialAmount - totalOfMonth).toFixed(2)) : 0;

  const mutation = useMutation<unknown, ApiError, DashboardMutationVariables>({
    mutationFn: ({ dashboardID, initialAmount }) => {
      if (dashboardID) {
        return updateInitialSalary(dashboardID, initialAmount);
      } else {
        return setInitialSalary(initialAmount);
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD, monthBeginning],
      });
    },
  });

  return {
    get,
    mutation,
    remaining,
    monthlyTotal,
  };
};

export default useDashboard;
