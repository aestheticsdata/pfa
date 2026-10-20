import { QUERY_KEYS } from "@lib/query/keys";
import { ExceptionalListSchema, ExceptionalYearsSchema, RegularMonthlyAverageSchema } from "@src/schemas/exceptionals";
import { parseResponse } from "@src/schemas/parseResponse";
import { queryOptions } from "@tanstack/react-query";

import type { PrivateRequest } from "@helpers/interfaces/httpTypes";

// Every query of the exceptionals module, declared once (PFA-253) — see spendings/services/queries.ts.

/** The exceptionals of a year, or of every year when `year` is undefined. */
export const exceptionalsQuery = (request: PrivateRequest, year?: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.EXCEPTIONALS, year ?? "all"],
    queryFn: async () => {
      const response = await request(`/exceptionals${year ? `?year=${year}` : ""}`);
      return parseResponse(ExceptionalListSchema, response.data, "/exceptionals");
    },
    retry: false,
  });

export const exceptionalYearsQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.EXCEPTIONAL_YEARS],
    queryFn: async () => {
      const response = await request("/exceptionals/years");
      return parseResponse(ExceptionalYearsSchema, response.data, "/exceptionals/years");
    },
    retry: false,
  });

export const regularMonthlyAverageQuery = (request: PrivateRequest, year: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.REGULAR_MONTHLY_AVERAGE, year],
    queryFn: async () => {
      const response = await request(`/regular-monthly-average?year=${year}`);
      return parseResponse(RegularMonthlyAverageSchema, response.data, "/regular-monthly-average");
    },
    retry: false,
  });
