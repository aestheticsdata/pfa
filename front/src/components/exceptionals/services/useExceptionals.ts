import { exceptionalsQuery, exceptionalYearsQuery } from "@components/exceptionals/services/queries";
import { displayPopup } from "@helpers/displayPopup";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { ExceptionalMutationPayloadSchema } from "@src/schemas/exceptionals";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@helpers/http";
import type { ExceptionalMutationPayload } from "@src/schemas/exceptionals";

interface UseExceptionalsOptions {
  year?: number;
}

const useExceptionals = ({ year }: UseExceptionalsOptions = {}) => {
  const exceptionals = useTranslations("exceptionals");
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await invalidateFamilies(queryClient, [QUERY_KEYS.EXCEPTIONALS, QUERY_KEYS.EXCEPTIONAL_YEARS]);
  };

  const onSuccess = async (message: string) => {
    displayPopup({ text: message });
    await invalidate();
  };

  const list = useQuery(exceptionalsQuery(privateRequest, year));

  const years = useQuery(exceptionalYearsQuery(privateRequest));

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
