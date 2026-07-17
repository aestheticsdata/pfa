import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
import { SpendingListSchema, SpendingMutationPayloadSchema } from "@src/schemas/spendings";
import spendingsText from "@text/spendings";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
import { useMutation, useQuery, useQueryClient } from "react-query";

import type { SpendingDayGroup, SpendingItem } from "@components/spendings/types";
import type { SpendingMutationPayload } from "@src/schemas/spendings";
import type { AxiosError } from "axios";

interface DeletableSpending {
  ID: string;
}

const useSpendings = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from, to, range, setScrollToDayIso } = useDatePickerWrapperStore();
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

    const response = await privateRequest(`/spendings?userID=${userID}&from=${monthStart}&to=${monthEnd}`);
    return SpendingListSchema.parse(response.data);
  };

  const { data, isLoading, error } = useQuery([QUERY_KEYS.SPENDINGS_BY_MONTH, monthStart, monthEnd], getSpendings, {
    retry: false,
    // date store is available when coming from login because DatePicker
    // mounts before Spendings
    // but I don't know why when already logged in, and coming directly to spendings
    // Spendings mounts before DatePickerWrapper, causing from to be undefined and
    // hence this query to fail
    // so enable below
    enabled: !!from && !!to && !!userID,
    ...QUERY_OPTIONS,
  });

  const spendingsByMonth = data;
  const spendingsByWeek = data && range ? aggregateSpendingByDate(data, range) : undefined;

  const queryClient = useQueryClient();

  const spendingsActionOnSuccess = async (message: string) => {
    displayPopup({ text: spendingsText.toasts.spending(message) });

    await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH, from, to]);
    await queryClient.invalidateQueries([QUERY_KEYS.WEEKLY_STATS, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORY_STATS]);
    await queryClient.invalidateQueries([QUERY_KEYS.INITIAL_AMOUNT, monthBeginning]);
    await queryClient.invalidateQueries([QUERY_KEYS.CHARTS, monthBeginning]);
    // Whole-history search results (COS-114) can include the mutated row — refresh
    // them too. Inactive when the search modal is closed, so this is a no-op then.
    await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_SEARCH]);
  };

  const deleteSpendingService = async (spending: DeletableSpending) => {
    return privateRequest(`/spendings/${spending.ID}`, { method: "DELETE" });
  };

  const deleteSpending = useMutation(
    ({ spending }: { spending: DeletableSpending }) => {
      return deleteSpendingService(spending);
    },
    {
      onSuccess: () => {
        spendingsActionOnSuccess("supprimée");
      },
    },
  );

  const createSpendingService = async (spending: SpendingMutationPayload) => {
    const payload = SpendingMutationPayloadSchema.parse(spending);
    return privateRequest("/spendings", {
      method: "POST",
      data: payload,
    });
  };

  const createSpending = useMutation<unknown, AxiosError, SpendingMutationPayload>(
    (spending) => {
      return createSpendingService(spending);
    },
    {
      onSuccess: async (_data, variables) => {
        await spendingsActionOnSuccess("créée");
        // COS-38: once the list has refreshed, recenter the timeline on the day of
        // the spending just created — but only when that day belongs to the week
        // CURRENTLY on screen. We read the live range from the store rather than the
        // closure `range` (react-query snapshots the callback at mutate() time, so
        // the closure can be stale if the user changed week while the POST was in
        // flight). Creating a spending for another week must not yank the view to
        // it (product decision on the ticket's open edge case).
        const createdDate = variables?.date;
        const currentRange = useDatePickerWrapperStore.getState().range;
        if (createdDate && currentRange?.some((day) => format(day, "yyyy-MM-dd") === createdDate)) {
          setScrollToDayIso(createdDate);
        }
      },
      onError: (e) => {
        console.log("error creating spendings : ", e);
      },
    },
  );

  const updateSpendingService = async (spending: SpendingMutationPayload) => {
    const payload = SpendingMutationPayloadSchema.parse(spending);
    return privateRequest(`/spendings/${payload.id}`, {
      method: "PUT",
      data: payload,
    });
  };

  const updateSpending = useMutation<unknown, AxiosError, SpendingMutationPayload>(
    (spending) => {
      return updateSpendingService(spending);
    },
    {
      onSuccess: () => {
        spendingsActionOnSuccess("mise à jour");
      },
      onError: (e) => {
        console.log("error updating spending : ", e);
      },
    },
  );

  return {
    spendingsByWeek,
    spendingsByMonth,
    isLoading,
    error,
    deleteSpending,
    createSpending,
    updateSpending,
  };
};

export default useSpendings;
