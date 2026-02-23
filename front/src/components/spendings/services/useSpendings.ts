import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import getDate from "date-fns/getDate";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
import { useUserStore } from "@auth/store/userStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";

import type { SpendingCompoundType } from "@components/spendings/types";
import type { Spending } from "@components/spendings/interfaces/spendingDashboardTypes";

const useSpendings = () => {
  const [spendingsByWeek, setSpendingsByWeek] = useState<SpendingCompoundType[]>();
  const [spendingsByMonth, setSpendingsByMonth] = useState<SpendingCompoundType>();
  const { privateRequest } = useRequestHelper();
  const user = useUserStore((state) => state.user);
  const userID = user?.id;
  const { from, to, range } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);

  // transform an array of object into an array of array<Object> aggregated
  // by same date
  // const aggregateSpendingByDate = (spendings, range, exchangeRates, baseCurrency) => {
  const aggregateSpendingByDate = (spendings: SpendingCompoundType, range): SpendingCompoundType[] => {
    const tempArr = [];
    tempArr.total = 0;
    const spendingsPlaceholder = new Array(range.length).fill(tempArr);
    const spendingsFinal = [...spendingsPlaceholder];

    for (let j = 0, r = range.length; j < r; j += 1) {
      const arr: any = [];
      arr.total = 0;
      arr.date = getDate(range[j]);
      spendingsFinal[j] = arr;
    }

    for (let i = 0, l = spendings.length; i < l; i += 1 ) {
      for (let k = 0, ll = spendingsFinal.length; k < ll; k += 1) {
        if (getDate(parseISO(spendings[i].date)) === spendingsFinal[k].date) {
          spendingsFinal[k].push(spendings[i]);
          spendingsFinal[k].total += parseFloat(spendings[i].amount);
        }
      }
    }

    return spendingsFinal;
  };

  const getSpendings = async () => {
    try {
      return privateRequest(
        `/spendings?userID=${userID}&from=${startOfMonth(from!)}&to=${endOfMonth(to!)}`
      );
    } catch (e) {
      console.log("get spendings error", e);
    }
  };

  const { data, isLoading } = useQuery([QUERY_KEYS.SPENDINGS_BY_MONTH, startOfMonth(from!), endOfMonth(to!)], getSpendings, {
    retry: false,
    // date store is available when coming from login because DatePicker
    // mounts before Spendings
    // but I don't know why when already logged in, and coming directly to spendings
    // Spendings mounts before DatePickerWrapper, causing from to be undefined and
    // hence this query to fail
    // so enable below
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });

  useEffect(() => {
    if (data?.data) {
      range && setSpendingsByWeek(aggregateSpendingByDate(data.data, range));
      setSpendingsByMonth(data.data);
    }
  }, [data, range]);

  const queryClient = useQueryClient();

  const spendingsActionOnSuccess = async (message: string) => {
    displayPopup({ text: `dépense ${message}`});

    await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH, from, to]);
    await queryClient.invalidateQueries([QUERY_KEYS.WEEKLY_STATS, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
    await queryClient.invalidateQueries([QUERY_KEYS.INITIAL_AMOUNT, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CHARTS, monthBeginning]);
  }

  const deleteSpendingService = async (spending: Spending) => {
    return privateRequest(`/spendings/${spending.ID}`, { method: "DELETE" });
  }

  const deleteSpending = useMutation(({ spending }: { spending: Spending }) => {
    return deleteSpendingService(spending);
  }, {
    onSuccess: () => { spendingsActionOnSuccess("effacée") }
  });

  const createSpendingService = async (spending) => {
    return privateRequest("/spendings", {
      method: 'POST',
      data: spending,
    });
  }
  const createSpending = useMutation((spending) => {
    return createSpendingService(spending);
  }, {
    onSuccess: () => { spendingsActionOnSuccess("créée") },
    onError: (e) => {
      console.log("error creating spendings : ", e);
    }
  });

  const updateSpendingService = async (spending) => {
    return privateRequest(`/spendings/${spending.id}`, {
      method: "PUT",
      data: spending,
    });
  };

  const updateSpending = useMutation((spending) => {
    return updateSpendingService(spending);
  }, {
    onSuccess: () => { spendingsActionOnSuccess("mise à jour") },
    onError: (e) => {
      console.log("error updating spending : ", e);
    }
  });

  return {
    spendingsByWeek,
    spendingsByMonth,
    isLoading,
    deleteSpending,
    createSpending,
    updateSpending,
  };
}

export default useSpendings;

