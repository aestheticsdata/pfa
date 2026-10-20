import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { formatIsoDate } from "@helpers/dateRoute";
import { displayPopup } from "@helpers/displayPopup";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import {
  RecurringListSchema,
  RecurringMutationPayloadSchema,
  SpendingMutationPayloadSchema,
} from "@src/schemas/spendings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";

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

const useReccurings = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const from = useDatePickerWrapperStore((state) => state.from);
  const monthBeginning = from ? startOfMonth(from) : null;
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
    if (!monthBeginning) throw new Error("No month selected");
    const response = await privateRequest(`/recurrings?start=${formatIsoDate(monthBeginning)}`);
    return parseResponse(RecurringListSchema, response.data, "/recurrings");
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

export default useReccurings;
interface DeletableRecurring {
  ID: string;
}
