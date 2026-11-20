import { HTTP_METHOD } from "#api/httpMethod";
import { RecurringListSchema, RecurringsDrawnSchema } from "#schemas/spendings";

import type { Identified, YearMonth } from "#api/fetchers/interfaces/fetcherTypes";
import type { RecurringCreateInput } from "#api/fetchers/interfaces/payloadTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";
import type { RecurringMutationPayload } from "#schemas/spendings";

/** The month's fixed expenses (direct debits, subscriptions). */
export const fetchRecurrings = (api: ApiClient, monthStart: string) =>
  api.get("/recurrings", RecurringListSchema, { start: monthStart });

/** How much of the month's fixed expenses has been drawn so far. */
export const fetchRecurringsDrawn = (api: ApiClient, { year, month }: YearMonth) =>
  api.get("/recurrings/drawn", RecurringsDrawnSchema, { year, month });

/** Adds a fixed expense to a month (`start` → `end`, its 1st and last day). */
export const createRecurring = async (api: ApiClient, { payload, month }: RecurringCreateInput) => {
  await api.request("/recurrings", { method: HTTP_METHOD.post, data: { ...payload, ...month } });
};

export const updateRecurring = async (api: ApiClient, { id, payload }: Identified<RecurringMutationPayload>) => {
  await api.request(`/recurrings/${id}`, { method: HTTP_METHOD.put, data: payload });
};

export const deleteRecurring = async (api: ApiClient, recurringID: string) => {
  await api.request(`/recurrings/${recurringID}`, { method: HTTP_METHOD.delete });
};
