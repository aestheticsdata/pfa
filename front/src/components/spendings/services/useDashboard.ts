import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useInitialAmount from "@components/spendings/services/useInitialAmount";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { DashboardResponseSchema } from "@src/schemas/dashboard";
import endOfMonth from "date-fns/endOfMonth";
import formatISO from "date-fns/formatISO";
import startOfMonth from "date-fns/startOfMonth";
import { useMutation, useQuery, useQueryClient } from "react-query";

import type { DashboardResponse } from "@src/schemas/dashboard";
import type { AxiosError } from "axios";
import type { UseMutationResult, UseQueryResult } from "react-query";

interface UseDashboard {
  get: UseQueryResult<DashboardResponse>;
  mutation: UseMutationResult<unknown, AxiosError, DashboardMutationVariables>;
  remaining: number;
  monthlyTotal: number;
}

interface DashboardMutationVariables {
  dashboardID?: string;
  initialAmount: string;
}

const useDashboard = (): UseDashboard => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);
  const queryClient = useQueryClient();
  const { data: initialAmount } = useInitialAmount();

  const getDashboard = async () => {
    const response = await privateRequest(`/dashboard?userID=${userID}&start=${startOfMonth(from!)}`);
    return DashboardResponseSchema.parse(response.data);
  };

  const setInitialSalary = async (amount: string) => {
    return privateRequest("/dashboard", {
      method: "POST",
      data: {
        userID,
        amount: Number(amount),
        start: formatISO(startOfMonth(from!), { representation: "date" }),
        end: formatISO(endOfMonth(from!), { representation: "date" }),
      },
    });
  };

  const updateInitialSalary = async (dashboardID: string, amount: string) => {
    return privateRequest(`/dashboard/${dashboardID}`, {
      method: "PUT",
      data: {
        userID,
        amount: Number(amount),
      },
    });
  };

  const get = useQuery([QUERY_KEYS.DASHBOARD, monthBeginning], getDashboard, {
    retry: false,
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });

  const totalOfMonth =
    get.data && initialAmount
      ? Number(initialAmount.spendingsSum.amount) + Number(initialAmount.recurringsSum.amount)
      : 0;
  const monthlyTotal = Number(totalOfMonth.toFixed(2));
  const remaining = get.data ? Number((Number(get.data.initialAmount) - totalOfMonth).toFixed(2)) : 0;

  const mutation = useMutation<unknown, AxiosError, DashboardMutationVariables>(
    ({ dashboardID, initialAmount }) => {
      if (dashboardID) {
        return updateInitialSalary(dashboardID, initialAmount);
      } else {
        return setInitialSalary(initialAmount);
      }
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([QUERY_KEYS.DASHBOARD, monthBeginning]);
      },
    },
  );

  return {
    get,
    mutation,
    remaining,
    monthlyTotal,
  };
};

export default useDashboard;
