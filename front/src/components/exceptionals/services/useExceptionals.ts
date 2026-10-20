import { useAuth } from "@auth/context/AuthContext";
import { displayPopup } from "@helpers/displayPopup";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { QUERY_KEYS } from "@lib/query/keys";
import {
  ExceptionalListSchema,
  ExceptionalMutationPayloadSchema,
  ExceptionalYearsSchema,
} from "@src/schemas/exceptionals";
import { parseResponse } from "@src/schemas/parseResponse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@helpers/http";
import type { ExceptionalMutationPayload } from "@src/schemas/exceptionals";

interface UseExceptionalsOptions {
  year?: number;
}

const useExceptionals = ({ year }: UseExceptionalsOptions = {}) => {
  const exceptionals = useTranslations("exceptionals");
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

  const onSuccess = async (message: string) => {
    displayPopup({ text: message });
    await invalidate();
  };

  const getExceptionals = async () => {
    const yearParam = year ? `?year=${year}` : "";
    const response = await privateRequest(`/exceptionals${yearParam}`);
    return parseResponse(ExceptionalListSchema, response.data, "/exceptionals");
  };

  const list = useQuery({
    queryKey: [QUERY_KEYS.EXCEPTIONALS, year ?? "all"],
    queryFn: getExceptionals,
    retry: false,
    enabled: !!userID,
  });

  const getYears = async () => {
    const response = await privateRequest(`/exceptionals/years`);
    return parseResponse(ExceptionalYearsSchema, response.data, "/exceptionals/years");
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

  const createExceptional = useMutation<unknown, ApiError, ExceptionalMutationPayload>({
    mutationFn: (payload) => createExceptionalService(payload),
    onSuccess: () => onSuccess(exceptionals.toast.created),
  });

  const updateExceptionalService = async (payload: ExceptionalMutationPayload) => {
    const parsed = ExceptionalMutationPayloadSchema.parse(payload);
    return privateRequest(`/exceptionals/${parsed.id}`, {
      method: "PUT",
      data: parsed,
    });
  };

  const updateExceptional = useMutation<unknown, ApiError, ExceptionalMutationPayload>({
    mutationFn: (payload) => updateExceptionalService(payload),
    onSuccess: () => onSuccess(exceptionals.toast.updated),
  });

  const deleteExceptionalService = async (id: string) => {
    return privateRequest(`/exceptionals/${id}`, { method: "DELETE" });
  };

  const deleteExceptional = useMutation<unknown, ApiError, { id: string }>({
    mutationFn: ({ id }) => deleteExceptionalService(id),
    onSuccess: () => onSuccess(exceptionals.toast.deleted),
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
