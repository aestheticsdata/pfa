import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { QUERY_KEYS } from "@lib/query/keys";
import {
  RecurringListSchema,
  RecurringMutationPayloadSchema,
  SpendingMutationPayloadSchema,
} from "@src/schemas/spendings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import startOfMonth from "date-fns/startOfMonth";

import type { SpendingMutationPayload } from "@src/schemas/spendings";
import type { AxiosError } from "axios";

interface FormattedMonth {
  start: string;
  end: string;
}

interface Dates extends FormattedMonth {
  previousMonthStart: string;
  previousMonthEnd: string;
}

interface CreateRecurring {
  spendingEdited: SpendingMutationPayload;
  formattedMonth: FormattedMonth;
}

const useReccurings = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const { from } = useDatePickerWrapperStore();
  const monthBeginning = startOfMonth(from!);
  const spendingsText = useTranslations("spendings");

  const recurringsActionOnSuccess = async (message: string) => {
    displayPopup({ text: message });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.RECURRINGS, monthBeginning],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.DASHBOARD, monthBeginning],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.MONTHLY_STATS, monthBeginning],
    });
  };

  const getRecurrings = async () => {
    const response = await privateRequest(`/recurrings?userID=${userID}&start=${startOfMonth(from!)}`);
    return RecurringListSchema.parse(response.data);
  };

  const { data, isPending } = useQuery({
    queryKey: [QUERY_KEYS.RECURRINGS, monthBeginning],
    queryFn: getRecurrings,
    retry: false,
    enabled: !!from && !!userID,
  });

  const queryClient = useQueryClient();

  const deleteRecurringService = async (recurring: DeletableRecurring) => {
    return privateRequest(`/recurrings/${recurring.ID}`, { method: "DELETE" });
  };

  const deleteRecurring = useMutation({
    mutationFn: ({ recurring }: { recurring: DeletableRecurring }) => {
      return deleteRecurringService(recurring);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringDeleted),

    onError: (e) => {
      console.log("error deleting recurring", e);
    },
  });

  const createRecurringService = async (recurring: SpendingMutationPayload, formattedMonth: FormattedMonth) => {
    const payload = SpendingMutationPayloadSchema.parse(recurring);
    return privateRequest("/recurrings", {
      method: "POST",
      data: {
        ...payload,
        ...formattedMonth,
      },
    });
  };

  const copyRecurringsService = async (userID: string, dates: Dates) => {
    return privateRequest(`/recurrings/copy`, {
      method: "POST",
      data: {
        userID,
        dates,
      },
    });
  };

  const createRecurring = useMutation<unknown, AxiosError, CreateRecurring>({
    mutationFn: ({ spendingEdited, formattedMonth }: CreateRecurring) => {
      return createRecurringService(spendingEdited, formattedMonth);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringCreated),

    onError: (e) => {
      console.log("error creating recurring", e);
    },
  });

  const updateRecurringService = async (recurring: SpendingMutationPayload) => {
    const payload = RecurringMutationPayloadSchema.parse(recurring);
    return privateRequest(`/recurrings/${recurring.id}`, {
      method: "PUT",
      data: payload,
    });
  };

  const updateRecurring = useMutation<unknown, AxiosError, SpendingMutationPayload>({
    mutationFn: (recurring) => {
      return updateRecurringService(recurring);
    },

    onSuccess: () => {
      recurringsActionOnSuccess(spendingsText.toasts.recurringUpdated);
    },

    onError: (e) => {
      console.log("error updating recurring ", e);
    },
  });

  const copyRecurrings = useMutation<unknown, unknown, { userID: string; dates: Dates }>({
    mutationFn: ({ userID, dates }) => {
      return copyRecurringsService(userID, dates);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringsCopied),

    onError: (e) => {
      console.log("error copying recurrings", e);
    },
  });

  return {
    recurrings: data ?? [],
    isLoading: isPending,
    deleteRecurring,
    createRecurring,
    updateRecurring,
    copyRecurrings,
  };
};

export default useReccurings;
interface DeletableRecurring {
  ID: string;
}
