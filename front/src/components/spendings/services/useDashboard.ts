import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import formatISO from "date-fns/formatISO";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import useInitialAmount from "@components/spendings/services/useInitialAmount";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useUserStore } from "@auth/store/userStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";

import type { UseQueryResult } from "react-query";


export interface DashBoard {
  ID: string;
  dateFrom: string;
  dateTo: string;
  initialAmount: string;
  initialCeiling: string;
  userID: string;
}

export interface DashBoardData {
  data: DashBoard;
}

interface UseDashboard {
  get: UseQueryResult<DashBoardData>;
  mutation: any;
  remaining: number,
  monthlyTotal: number,
}


const useDashboard = (): UseDashboard => {
  const { privateRequest } = useRequestHelper();
  const user = useUserStore((state) => state.user);
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);
  const queryClient = useQueryClient();
  const { data: initialAmount } = useInitialAmount();
  const [remaining, setRemaining] = useState<number>(0);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);

  const getDashboard = async () => {
    return privateRequest(
      `/dashboard?userID=${userID}&start=${startOfMonth(from!)}`
    );
  };

  const setInitialSalary = async (amount: string) => {
    return privateRequest(
      '/dashboard', {
        method: 'POST',
        data: {
          userID,
          amount,
          start: formatISO(startOfMonth(from!), { representation: "date" }),
          end: formatISO(endOfMonth(from!), { representation: "date" }),
        }
      }
    )
  }

  const updateInitialSalary = async (dashboardID: string, amount: string) => {
    return privateRequest(
      `/dashboard/${dashboardID}`, {
        method: 'PUT',
        data: {
          userID,
          amount,
        },
      }
    )
  }

  const get = useQuery([QUERY_KEYS.DASHBOARD, monthBeginning], getDashboard, {
    retry: false,
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });

  useEffect(() => {
    if (get.data?.data && initialAmount) {
      const totalOfMonth: number = (Number(initialAmount.spendingsSum.amount) + Number(initialAmount.recurringsSum.amount));
      setMonthlyTotal(Number(totalOfMonth.toFixed(2)));
      setRemaining(Number((Number(get.data.data.initialAmount) - totalOfMonth).toFixed(2)));
    }
  }, [get.data, initialAmount]);

  const mutation = useMutation(({ dashboardID, initialAmount }) => {
    if (dashboardID) {
      return updateInitialSalary(dashboardID, initialAmount);
    } else {
      return setInitialSalary(initialAmount);
    }
  }, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(["dashboard", monthBeginning]);
    }
  });

  return {
    get,
    mutation,
    remaining,
    monthlyTotal,
  }
};

export default useDashboard;

