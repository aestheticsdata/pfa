import { QUERY_KEYS } from "@lib/query/keys";
import { MonthlyIncomeResponseSchema } from "@src/schemas/dashboard";
import { parseResponse } from "@src/schemas/parseResponse";
import { RecurringsDrawnSchema } from "@src/schemas/spendings";
import {
  BiggestRegularExpenseResponseSchema,
  DailyStatsResponseSchema,
  SearchTimelineResponseSchema,
  StatisticsResponseSchema,
  WeekdayCategoriesResponseSchema,
} from "@src/schemas/stats";
import { queryOptions } from "@tanstack/react-query";

import type {
  SearchTimelineParams,
  StatisticsParams,
  YearMonth,
} from "@components/statistics/interfaces/statisticsQueryTypes";
import type { PrivateRequest } from "@helpers/interfaces/httpTypes";

// Every query of the statistics module, declared once (PFA-253) — see spendings/services/queries.ts.

/** Per-category monthly totals for the years asked, across all of the user's categories. */
export const statisticsQuery = (request: PrivateRequest, { years, categoryIds }: StatisticsParams) =>
  queryOptions({
    queryKey: [QUERY_KEYS.STATISTICS, years, categoryIds],
    queryFn: async () => {
      const response = await request(`/statistics?years=${years}&categories=${categoryIds}`);
      return parseResponse(StatisticsResponseSchema, response.data, "/statistics");
    },
    retry: true,
    enabled: years !== "" && categoryIds !== "",
  });

export const dailyStatsQuery = (request: PrivateRequest, year: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.DAILY_STATS, year],
    queryFn: async () => {
      const response = await request(`/daily-stats?year=${year}`);
      return parseResponse(DailyStatsResponseSchema, response.data, "/daily-stats");
    },
    retry: false,
  });

export const monthlyIncomeQuery = (request: PrivateRequest, year: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.MONTHLY_INCOME, year],
    queryFn: async () => {
      const response = await request(`/dashboard/monthly-income?year=${year}`);
      return parseResponse(MonthlyIncomeResponseSchema, response.data, "/dashboard/monthly-income");
    },
    retry: false,
  });

export const weekdayCategoriesQuery = (request: PrivateRequest, year: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.WEEKDAY_CATEGORIES, year],
    queryFn: async () => {
      const response = await request(`/weekday-categories?year=${year}`);
      return parseResponse(WeekdayCategoriesResponseSchema, response.data, "/weekday-categories");
    },
    retry: false,
  });

export const biggestRegularExpenseQuery = (request: PrivateRequest, year: number) =>
  queryOptions({
    queryKey: [QUERY_KEYS.BIGGEST_REGULAR_EXPENSE, year],
    queryFn: async () => {
      const response = await request(`/biggest-regular-expense?year=${year}`);
      return parseResponse(BiggestRegularExpenseResponseSchema, response.data, "/biggest-regular-expense");
    },
    retry: false,
  });

export const recurringsDrawnQuery = (request: PrivateRequest, { year, month }: YearMonth) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECURRINGS_DRAWN, year, month],
    queryFn: async () => {
      const response = await request(`/recurrings/drawn?year=${year}&month=${month}`);
      return parseResponse(RecurringsDrawnSchema, response.data, "/recurrings/drawn");
    },
    retry: false,
  });

export const searchTimelineQuery = (request: PrivateRequest, { query, from, to, bucket }: SearchTimelineParams) =>
  queryOptions({
    queryKey: [QUERY_KEYS.SEARCH_TIMELINE, query, from, to, bucket],
    queryFn: async () => {
      const response = await request(
        `/search-timeline?q=${encodeURIComponent(query)}&from=${from}&to=${to}&bucket=${bucket}`,
      );
      return parseResponse(SearchTimelineResponseSchema, response.data, "/search-timeline");
    },
    retry: false,
    throwOnError: false,
  });
