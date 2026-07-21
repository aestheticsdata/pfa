import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
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

  const recurringsActionOnSuccess = async (message: string) => {
    displayPopup({ text: `recurring ${message}` });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.RECURRINGS, monthBeginning],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.DASHBOARD, monthBeginning],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.INITIAL_AMOUNT, monthBeginning],
    });
  };

  const getRecurrings = async () => {
    const response = await privateRequest(`/recurrings?userID=${userID}&start=${startOfMonth(from!)}`);
    return RecurringListSchema.parse(response.data);
  };

  const { data, isPending, error } = useQuery({
    queryKey: [QUERY_KEYS.RECURRINGS, monthBeginning],
    queryFn: getRecurrings,
    retry: false,
    enabled: !!from && !!userID,
    ...QUERY_OPTIONS,
  });

  const queryClient = useQueryClient();

  const deleteRecurringService = async (recurring: DeletableRecurring) => {
    return privateRequest(`/recurrings/${recurring.ID}`, { method: "DELETE" });
  };

  const deleteRecurring = useMutation({
    mutationFn: ({ recurring }: { recurring: DeletableRecurring }) => {
      return deleteRecurringService(recurring);
    },

    onSuccess: () => recurringsActionOnSuccess("supprimé"),

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

    onSuccess: () => recurringsActionOnSuccess("créé"),

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
      recurringsActionOnSuccess("mis à jour");
    },

    onError: (e) => {
      console.log("error updating recurring ", e);
    },
  });

  const copyRecurrings = useMutation<unknown, unknown, { userID: string; dates: Dates }>({
    mutationFn: ({ userID, dates }) => {
      return copyRecurringsService(userID, dates);
    },

    onSuccess: () => recurringsActionOnSuccess("créés"),

    onError: (e) => {
      console.log("error copying recurrings", e);
    },
  });

  return {
    recurrings: data ?? [],
    isLoading: isPending,
    error,
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
