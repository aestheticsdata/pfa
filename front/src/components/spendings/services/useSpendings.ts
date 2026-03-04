import { useQuery, useMutation, useQueryClient } from "react-query";
import getDate from "date-fns/getDate";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import {
  SpendingListSchema,
  SpendingMutationPayloadSchema,
} from "@src/schemas/spendings";

import type { AxiosError } from "axios";
import type { SpendingDayGroup, SpendingItem } from "@components/spendings/types";
import type { SpendingMutationPayload } from "@src/schemas/spendings";

interface DeletableSpending {
  ID: string;
}

const useSpendings = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from, to, range } = useDatePickerWrapperStore();
  const monthStart = from ? startOfMonth(from) : undefined;
  const monthEnd = to ? endOfMonth(to) : undefined;
  const monthBeginning = monthStart;

  const aggregateSpendingByDate = (spendings: SpendingItem[], dateRange: Date[]): SpendingDayGroup[] => {
    const grouped = dateRange.map((currentDate) => ({
      dayOfMonth: getDate(currentDate),
      total: 0,
      items: [] as SpendingItem[],
    }));

    for (const spending of spendings) {
      const day = getDate(parseISO(spending.date));
      const matchingGroup = grouped.find((entry) => entry.dayOfMonth === day);
      if (matchingGroup) {
        matchingGroup.items.push(spending);
        matchingGroup.total += spending.amount;
      }
    }

    return grouped;
  };

  const getSpendings = async () => {
    if (!monthStart || !monthEnd) {
      return [];
    }

    const response = await privateRequest(
      `/spendings?userID=${userID}&from=${monthStart}&to=${monthEnd}`
    );
    return SpendingListSchema.parse(response.data);
  };

  const { data, isLoading, error } = useQuery(
    [QUERY_KEYS.SPENDINGS_BY_MONTH, monthStart, monthEnd],
    getSpendings,
    {
      retry: false,
      // date store is available when coming from login because DatePicker
      // mounts before Spendings
      // but I don't know why when already logged in, and coming directly to spendings
      // Spendings mounts before DatePickerWrapper, causing from to be undefined and
      // hence this query to fail
      // so enable below
      enabled: !!from && !!to && !!userID,
      ...QUERY_OPTIONS,
    }
  );

  const spendingsByMonth = data;
  const spendingsByWeek = data && range
    ? aggregateSpendingByDate(data, range)
    : undefined;

  const queryClient = useQueryClient();

  const spendingsActionOnSuccess = async (message: string) => {
    displayPopup({ text: `dépense ${message}`});

    await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH, from, to]);
    await queryClient.invalidateQueries([QUERY_KEYS.WEEKLY_STATS, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
    await queryClient.invalidateQueries([QUERY_KEYS.INITIAL_AMOUNT, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CHARTS, monthBeginning]);
  }

  const deleteSpendingService = async (spending: DeletableSpending) => {
    return privateRequest(`/spendings/${spending.ID}`, { method: "DELETE" });
  }

  const deleteSpending = useMutation(({ spending }: { spending: DeletableSpending }) => {
    return deleteSpendingService(spending);
  }, {
    onSuccess: () => { spendingsActionOnSuccess("effacée") }
  });

  const createSpendingService = async (spending: SpendingMutationPayload) => {
    const payload = SpendingMutationPayloadSchema.parse(spending);
    return privateRequest("/spendings", {
      method: 'POST',
      data: payload,
    });
  }

  const createSpending = useMutation<unknown, AxiosError, SpendingMutationPayload>((spending) => {
    return createSpendingService(spending);
  }, {
    onSuccess: () => { spendingsActionOnSuccess("créée") },
    onError: (e) => {
      console.log("error creating spendings : ", e);
    }
  });

  const updateSpendingService = async (spending: SpendingMutationPayload) => {
    const payload = SpendingMutationPayloadSchema.parse(spending);
    return privateRequest(`/spendings/${payload.id}`, {
      method: "PUT",
      data: payload,
    });
  };

  const updateSpending = useMutation<unknown, AxiosError, SpendingMutationPayload>((spending) => {
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
    error,
    deleteSpending,
    createSpending,
    updateSpending,
  };
}

export default useSpendings;
