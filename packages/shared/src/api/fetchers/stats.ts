import { aggregateTrendsByCategory } from "#api/fetchers/categoryTrends";
import {
  BiggestRegularExpenseResponseSchema,
  BusiestWeekResponseSchema,
  CategoryTrendsResponseSchema,
  DailyStatsResponseSchema,
  SearchTimelineResponseSchema,
  SpendingPaceResponseSchema,
  StatisticsResponseSchema,
  WeekdayCategoriesResponseSchema,
} from "#schemas/stats";

import type {
  CategoryTrendsWindows,
  SearchTimelineParams,
  StatisticsParams,
} from "#api/fetchers/interfaces/fetcherTypes";
import type { ApiClient } from "#api/interfaces/httpTypes";

export const fetchSpendingPace = (api: ApiClient, monthStart: string) =>
  api.get("/spending-pace", SpendingPaceResponseSchema, { start: monthStart });

export const fetchBusiestWeek = (api: ApiClient, monthStart: string) =>
  api.get("/busiest-week", BusiestWeekResponseSchema, { start: monthStart });

/** Category totals over a window and the one before it, one row per category name. */
export const fetchCategoryTrends = async (api: ApiClient, windows: CategoryTrendsWindows) => {
  const response = await api.get("/category-trends", CategoryTrendsResponseSchema, {
    from: windows.current.from,
    to: windows.current.to,
    prevFrom: windows.previous.from,
    prevTo: windows.previous.to,
  });
  return { trends: aggregateTrendsByCategory(response.trends), previousTotal: response.previousTotal };
};

export const fetchStatistics = (api: ApiClient, params: StatisticsParams) =>
  api.get("/statistics", StatisticsResponseSchema, { years: params.years, categories: params.categoryIds });

/** One total per day of the year — the heatmap and the weekday averages. */
export const fetchDailyStats = (api: ApiClient, year: number) =>
  api.get("/daily-stats", DailyStatsResponseSchema, { year });

export const fetchWeekdayCategories = (api: ApiClient, year: number) =>
  api.get("/weekday-categories", WeekdayCategoriesResponseSchema, { year });

export const fetchBiggestRegularExpense = (api: ApiClient, year: number) =>
  api.get("/biggest-regular-expense", BiggestRegularExpenseResponseSchema, { year });

/** When a search term was spent on, bucketed by day or week (COS-160). */
export const fetchSearchTimeline = (api: ApiClient, params: SearchTimelineParams) =>
  api.get("/search-timeline", SearchTimelineResponseSchema, {
    q: params.query,
    from: params.from,
    to: params.to,
    bucket: params.bucket,
  });
