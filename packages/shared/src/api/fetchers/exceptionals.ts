import { HTTP_METHOD } from "#api/httpMethod";
import { ExceptionalListSchema, ExceptionalYearsSchema, RegularMonthlyAverageSchema } from "#schemas/exceptionals";

import type { Identified } from "#api/fetchers/interfaces/fetcherTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";
import type { ExceptionalMutationPayload } from "#schemas/exceptionals";

/** A year's exceptional spendings, or all of them without a year. */
export const fetchExceptionals = (api: ApiClient, year?: number) =>
  api.get("/exceptionals", ExceptionalListSchema, year === undefined ? undefined : { year });

export const fetchExceptionalYears = (api: ApiClient) => api.get("/exceptionals/years", ExceptionalYearsSchema);

/** The year's average monthly regular spending — what "≈ x months of budget" is measured against. */
export const fetchRegularMonthlyAverage = (api: ApiClient, year: number) =>
  api.get("/regular-monthly-average", RegularMonthlyAverageSchema, { year });

export const createExceptional = async (api: ApiClient, payload: ExceptionalMutationPayload) => {
  await api.request("/exceptionals", { method: HTTP_METHOD.post, data: payload });
};

export const updateExceptional = async (api: ApiClient, { id, payload }: Identified<ExceptionalMutationPayload>) => {
  await api.request(`/exceptionals/${id}`, { method: HTTP_METHOD.put, data: payload });
};

export const deleteExceptional = async (api: ApiClient, exceptionalID: string) => {
  await api.request(`/exceptionals/${exceptionalID}`, { method: HTTP_METHOD.delete });
};
