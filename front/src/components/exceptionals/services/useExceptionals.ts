import { useAuth } from "@auth/context/AuthContext";
import { displayPopup } from "@helpers/swalHelper";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import {
  ExceptionalListSchema,
  ExceptionalMutationPayloadSchema,
  ExceptionalYearsSchema,
} from "@src/schemas/exceptionals";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import exceptionals from "@text/exceptionals";

import type { ExceptionalMutationPayload } from "@src/schemas/exceptionals";
import type { AxiosError } from "axios";

interface UseExceptionalsOptions {
  year?: number;
}

const useExceptionals = ({ year }: UseExceptionalsOptions = {}) => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.EXCEPTIONALS],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.EXCEPTIONAL_YEARS],
    });
  };

  const onSuccess = async (action: string) => {
    displayPopup({ text: exceptionals.toast.mutated(action) });
    await invalidate();
  };

  const getExceptionals = async () => {
    const yearParam = year ? `?year=${year}` : "";
    const response = await privateRequest(`/exceptionals${yearParam}`);
    return ExceptionalListSchema.parse(response.data);
  };

  const list = useQuery({
    queryKey: [QUERY_KEYS.EXCEPTIONALS, year ?? "all"],
    queryFn: getExceptionals,
    retry: false,
    enabled: !!userID,
  });

  const getYears = async () => {
    const response = await privateRequest(`/exceptionals/years`);
    return ExceptionalYearsSchema.parse(response.data);
  };

  const years = useQuery({
    queryKey: [QUERY_KEYS.EXCEPTIONAL_YEARS],
    queryFn: getYears,
    retry: false,
    enabled: !!userID,
  });

  const createExceptionalService = async (payload: ExceptionalMutationPayload) => {
    const parsed = ExceptionalMutationPayloadSchema.parse(payload);
    return privateRequest("/exceptionals", {
      method: "POST",
      data: parsed,
    });
  };

  const createExceptional = useMutation<unknown, AxiosError, ExceptionalMutationPayload>({
    mutationFn: (payload) => createExceptionalService(payload),
    onSuccess: () => onSuccess("créée"),

    onError: (e) => {
      console.log("error creating exceptional", e);
    },
  });

  const updateExceptionalService = async (payload: ExceptionalMutationPayload) => {
    const parsed = ExceptionalMutationPayloadSchema.parse(payload);
    return privateRequest(`/exceptionals/${parsed.id}`, {
      method: "PUT",
      data: parsed,
    });
  };

  const updateExceptional = useMutation<unknown, AxiosError, ExceptionalMutationPayload>({
    mutationFn: (payload) => updateExceptionalService(payload),
    onSuccess: () => onSuccess("mise à jour"),

    onError: (e) => {
      console.log("error updating exceptional", e);
    },
  });

  const deleteExceptionalService = async (id: string) => {
    return privateRequest(`/exceptionals/${id}`, { method: "DELETE" });
  };

  const deleteExceptional = useMutation<unknown, AxiosError, { id: string }>({
    mutationFn: ({ id }) => deleteExceptionalService(id),
    onSuccess: () => onSuccess("supprimée"),

    onError: (e) => {
      console.log("error deleting exceptional", e);
    },
  });

  return {
    exceptionals: list.data ?? [],
    isLoading: list.isPending,
    years: years.data ?? [],
    createExceptional,
    updateExceptional,
    deleteExceptional,
  };
};

export default useExceptionals;
