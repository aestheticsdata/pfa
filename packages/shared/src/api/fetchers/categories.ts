import { HTTP_METHOD } from "#api/httpMethod";
import { CategoryListSchema } from "#schemas/categories";
import { CategoryStatsResponseSchema } from "#schemas/categoryStats";

import type { DateBounds } from "#api/fetchers/interfaces/fetcherTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";
import type { UpdateCategoryPayload } from "#schemas/categories";

// No create: a category is only ever created implicitly, with the spending that names it.

export const fetchCategories = (api: ApiClient) => api.get("/categories", CategoryListSchema);

/** Count and total per category over a window, or over all time without one. */
export const fetchCategoryStats = (api: ApiClient, range?: DateBounds) =>
  api.get("/category-stats", CategoryStatsResponseSchema, range ? { from: range.from, to: range.to } : undefined);

export const updateCategory = async (api: ApiClient, payload: UpdateCategoryPayload) => {
  await api.request(`/categories/${payload.ID}`, {
    method: HTTP_METHOD.put,
    data: { name: payload.name, color: payload.color },
  });
};

export const deleteCategory = async (api: ApiClient, categoryID: string) => {
  await api.request(`/categories/${categoryID}`, { method: HTTP_METHOD.delete });
};
