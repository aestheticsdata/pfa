import { z } from "zod";
import { HTTP_METHOD } from "#api/httpMethod";
import { itemTypeSchema } from "#schemas/primitives";
import {
  CreateSpendingResponseSchema,
  LabelSuggestionListSchema,
  SpendingListSchema,
  SpendingSearchPageSchema,
  SpendingYearsSchema,
} from "#schemas/spendings";

import type { DateBounds, Identified, SpendingSearchParams } from "#api/fetchers/interfaces/fetcherTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";
import type { SpendingMutationPayload } from "#schemas/spendings";

const ReceiptImageSchema = z.string().nullable();

/** The spendings of a window, usually a month from its 1st to its last day. */
export const fetchSpendings = (api: ApiClient, bounds: DateBounds) =>
  api.get("/spendings", SpendingListSchema, { from: bounds.from, to: bounds.to });

/** One page of the cursor-paginated search over every spending (PFA-188). */
export const searchSpendings = (api: ApiClient, params: SpendingSearchParams) =>
  api.get("/spendings/search", SpendingSearchPageSchema, {
    q: params.query,
    year: params.year,
    cursor: params.cursor,
  });

export const fetchSpendingYears = (api: ApiClient) => api.get("/spendings/years", SpendingYearsSchema);

/** The user's past labels matching what is typed (COS-23). */
export const fetchLabelSuggestions = (api: ApiClient, query: string) =>
  api.get("/spendings/label-suggestions", LabelSuggestionListSchema, { q: query });

/** A spending's receipt image as a `data:` URL, or null when it has none. */
export const fetchReceiptImage = async (api: ApiClient, spendingID: string) => {
  const response = await api.request(`/spendings/upload/${spendingID}`, {
    query: { itemType: itemTypeSchema.enum.spending },
  });
  const parsed = ReceiptImageSchema.safeParse(response.data);
  return parsed.success ? parsed.data : null;
};

/** Creates a spending; a new category in `payload.category` is created with it, as on the web. */
export const createSpending = (api: ApiClient, payload: SpendingMutationPayload) =>
  api.send("/spendings", { method: HTTP_METHOD.post, data: payload, schema: CreateSpendingResponseSchema });

export const updateSpending = async (api: ApiClient, { id, payload }: Identified<SpendingMutationPayload>) => {
  await api.request(`/spendings/${id}`, { method: HTTP_METHOD.put, data: payload });
};

export const deleteSpending = async (api: ApiClient, spendingID: string) => {
  await api.request(`/spendings/${spendingID}`, { method: HTTP_METHOD.delete });
};
