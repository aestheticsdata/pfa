import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { recurringsQuery } from "@components/spendings/services/queries";
import { monthStartIso } from "@helpers/dateRoute";
import { displayPopup } from "@helpers/displayPopup";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { RecurringMutationPayloadSchema, SpendingMutationPayloadSchema } from "@src/schemas/spendings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@helpers/http";
import type { SpendingMutationPayload } from "@src/schemas/spendings";

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

const useRecurrings = () => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  const spendingsText = useTranslations("spendings");

  const recurringsActionOnSuccess = async (message: string) => {
    displayPopup({ text: message });
    await invalidateFamilies(queryClient, [QUERY_KEYS.RECURRINGS, QUERY_KEYS.DASHBOARD, QUERY_KEYS.MONTHLY_STATS]);
  };

  const { data, isPending } = useQuery(recurringsQuery(privateRequest, monthStartIso(from)));

  const queryClient = useQueryClient();

  const deleteRecurringService = async (recurring: DeletableRecurring) => {
    return privateRequest(`/recurrings/${recurring.ID}`, { method: "DELETE" });
  };

  const deleteRecurring = useMutation({
    mutationFn: ({ recurring }: { recurring: DeletableRecurring }) => {
      return deleteRecurringService(recurring);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringDeleted),
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

  const copyRecurringsService = async (dates: Dates) => {
    return privateRequest(`/recurrings/copy`, {
      method: "POST",
      data: { dates },
    });
  };

  const createRecurring = useMutation<unknown, ApiError, CreateRecurring>({
    mutationFn: ({ spendingEdited, formattedMonth }: CreateRecurring) => {
      return createRecurringService(spendingEdited, formattedMonth);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringCreated),
  });

  const updateRecurringService = async (recurring: SpendingMutationPayload) => {
    const payload = RecurringMutationPayloadSchema.parse(recurring);
    return privateRequest(`/recurrings/${recurring.id}`, {
      method: "PUT",
      data: payload,
    });
  };

  const updateRecurring = useMutation<unknown, ApiError, SpendingMutationPayload>({
    mutationFn: (recurring) => {
      return updateRecurringService(recurring);
    },

    onSuccess: () => {
      recurringsActionOnSuccess(spendingsText.toasts.recurringUpdated);
    },
  });

  const copyRecurrings = useMutation<unknown, unknown, Dates>({
    mutationFn: (dates) => {
      return copyRecurringsService(dates);
    },

    onSuccess: () => recurringsActionOnSuccess(spendingsText.toasts.recurringsCopied),
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

export default useRecurrings;
interface DeletableRecurring {
  ID: string;
}
