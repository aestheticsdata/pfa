import { QUERY_KEYS } from "@lib/query/keys";
import { CategoryStatsResponseSchema } from "@src/schemas/categoryStats";
import { parseResponse } from "@src/schemas/parseResponse";
import { queryOptions } from "@tanstack/react-query";

import type { DateBounds } from "@components/spendings/interfaces/spendingQueryTypes";
import type { PrivateRequest } from "@helpers/interfaces/httpTypes";

// The categories module's query, declared once (PFA-253) — see spendings/services/queries.ts.

/** Per-category totals over a window, or over the whole history when `range` is undefined. */
export const categoryStatsQuery = (request: PrivateRequest, range?: DateBounds) =>
  queryOptions({
    queryKey: [QUERY_KEYS.CATEGORY_STATS, range?.from ?? null, range?.to ?? null],
    queryFn: async () => {
      const query = range ? `?from=${range.from}&to=${range.to}` : "";
      const response = await request(`/category-stats${query}`);
      return parseResponse(CategoryStatsResponseSchema, response.data, "/category-stats");
    },
    retry: 2,
    throwOnError: false,
  });
