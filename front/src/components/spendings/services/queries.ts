import { QUERY_KEYS } from "@lib/query/keys";
import { requireParam } from "@lib/query/requireParam";
import { CategoryListSchema } from "@src/schemas/categories";
import {
  DailyProjectionSchema,
  DashboardResponseSchema,
  MonthlyStatsSchema,
  WeeklyStatsSchema,
} from "@src/schemas/dashboard";
import { parseResponse } from "@src/schemas/parseResponse";
import { itemTypeSchema } from "@src/schemas/primitives";
import {
  ProductTypeListSchema,
  ReceiptLinesResponseSchema,
  ReceiptProposalSchema,
  StoreListSchema,
} from "@src/schemas/receiptLines";
import {
  LabelSuggestionListSchema,
  RecurringListSchema,
  SpendingListSchema,
  SpendingSearchPageSchema,
  SpendingYearsSchema,
} from "@src/schemas/spendings";
import {
  BusiestWeekResponseSchema,
  CategoryTrendsResponseSchema,
  SpendingPaceResponseSchema,
} from "@src/schemas/stats";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import type {
  CategoryTrendsResult,
  CategoryTrendsWindows,
  DateBounds,
  SpendingSearchParams,
} from "@components/spendings/interfaces/spendingQueryTypes";
import type { PrivateRequest } from "@helpers/interfaces/httpTypes";
import type { CategoryTrendPoint } from "@src/schemas/stats";

// Every query of the spendings module, declared once (PFA-253): key + fetcher + the options that
// belong to the data rather than to a screen. A hook calls `useQuery(xxxQuery(privateRequest, …))`
// and may add its own options; a mutation invalidates by family (`invalidateFamilies`). Month keys
// hold the yyyy-MM-dd string the request sends, so the key and the URL can never disagree.

/** The month's spendings, from its 1st to its last day. */
export const spendingsByMonthQuery = (request: PrivateRequest, month: DateBounds | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.SPENDINGS_BY_MONTH, month?.from ?? null, month?.to ?? null],
    queryFn: async () => {
      const { from, to } = requireParam(month, "month");
      const response = await request(`/spendings?from=${from}&to=${to}`);
      return parseResponse(SpendingListSchema, response.data, "/spendings");
    },
    enabled: month !== null,
    retry: false,
  });

export const dashboardQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.DASHBOARD, monthStart],
    queryFn: async () => {
      const response = await request(`/dashboard?start=${requireParam(monthStart, "month")}`);
      return parseResponse(DashboardResponseSchema, response.data, "/dashboard");
    },
    enabled: monthStart !== null,
    retry: false,
  });

/** The month's spendings and fixed-expenses totals (COS-179). */
export const monthlyStatsQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.MONTHLY_STATS, monthStart],
    queryFn: async () => {
      const response = await request(`/monthlystats?from=${requireParam(monthStart, "month")}`);
      return parseResponse(MonthlyStatsSchema, response.data, "/monthlystats");
    },
    enabled: monthStart !== null,
    retry: false,
  });

export const weeklyStatsQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.WEEKLY_STATS, monthStart],
    queryFn: async () => {
      const response = await request(`/weeklystats?start=${requireParam(monthStart, "month")}`);
      return parseResponse(WeeklyStatsSchema, response.data, "/weeklystats");
    },
    enabled: monthStart !== null,
    retry: false,
  });

export const recurringsQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECURRINGS, monthStart],
    queryFn: async () => {
      const response = await request(`/recurrings?start=${requireParam(monthStart, "month")}`);
      return parseResponse(RecurringListSchema, response.data, "/recurrings");
    },
    enabled: monthStart !== null,
    retry: false,
  });

/**
 * The reference period behind the sparkline's projected tail (COS-27). The caller gates it to the
 * current month. `start` is a clean ISO date so the backend's UTC month arithmetic is tz-safe.
 */
export const dailyProjectionQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.DAILY_PROJECTION, monthStart],
    queryFn: async () => {
      const response = await request(`/dashboard/projection?start=${requireParam(monthStart, "month")}`);
      return parseResponse(DailyProjectionSchema, response.data, "/dashboard/projection");
    },
    enabled: monthStart !== null,
    retry: false,
  });

export const spendingPaceQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.SPENDING_PACE, monthStart],
    queryFn: async () => {
      const query = new URLSearchParams({ start: requireParam(monthStart, "month") });
      const response = await request(`/spending-pace?${query}`);
      return parseResponse(SpendingPaceResponseSchema, response.data, "/spending-pace");
    },
    enabled: monthStart !== null,
    retry: false,
  });

export const busiestWeekQuery = (request: PrivateRequest, monthStart: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.BUSIEST_WEEK, monthStart],
    queryFn: async () => {
      const query = new URLSearchParams({ start: requireParam(monthStart, "month") });
      const response = await request(`/busiest-week?${query}`);
      return parseResponse(BusiestWeekResponseSchema, response.data, "/busiest-week");
    },
    enabled: monthStart !== null,
    retry: false,
  });

// A user category and a global one can share a name; merge those rows by name —
// summing both period totals — then sort by current amount desc, mirroring
// useCharts' old aggregateByCategory but carrying the comparison-period value.
// `previousValue` stays null (a "new" category) only when every merged row was.
const aggregateByCategory = (items: CategoryTrendPoint[]): CategoryTrendPoint[] => {
  const map = new Map<string, CategoryTrendPoint>();
  for (const item of items) {
    const key = item.category ?? "__uncategorized__";
    const existing = map.get(key);
    if (existing) {
      existing.value += item.value;
      if (item.previousValue !== null) {
        existing.previousValue = (existing.previousValue ?? 0) + item.previousValue;
      }
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
};

export const categoryTrendsQuery = (request: PrivateRequest, windows: CategoryTrendsWindows | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.CATEGORY_TRENDS, windows?.current.from ?? null, windows?.current.to ?? null],
    queryFn: async (): Promise<CategoryTrendsResult> => {
      const { current, previous } = requireParam(windows, "windows");
      const query = new URLSearchParams({
        from: current.from,
        to: current.to,
        prevFrom: previous.from,
        prevTo: previous.to,
      });
      const response = await request(`/category-trends?${query}`);
      const parsed = parseResponse(CategoryTrendsResponseSchema, response.data, "/category-trends");
      return { trends: aggregateByCategory(parsed.trends), previousTotal: parsed.previousTotal };
    },
    enabled: windows !== null,
    retry: false,
  });

export const categoriesQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: async () => {
      const response = await request("/categories");
      return parseResponse(CategoryListSchema, response.data, "/categories");
    },
    retry: 2,
  });

/** The user's past labels matching what is typed (COS-23). Degrades silently: no error page. */
export const labelSuggestionsQuery = (request: PrivateRequest, query: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.LABEL_SUGGESTIONS, query],
    queryFn: async () => {
      const response = await request(`/spendings/label-suggestions?q=${encodeURIComponent(query)}`);
      return parseResponse(LabelSuggestionListSchema, response.data, "/spendings/label-suggestions");
    },
    retry: false,
    // Autocomplete is a nice-to-have inside the spending modal — a failure just
    // means no suggestions, never an error screen (opts out of the global
    // throwOnError).
    throwOnError: false,
  });

export const spendingYearsQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.SPENDINGS_YEARS],
    queryFn: async () => {
      const response = await request("/spendings/years");
      return parseResponse(SpendingYearsSchema, response.data, "/spendings/years");
    },
    retry: false,
    // On failure the year chips simply don't render; the search modal surfaces
    // its own errors inline (opts out of the global throwOnError).
    throwOnError: false,
  });

/** Cursor-paginated search over every spending (PFA-188). */
export const spendingSearchQuery = (request: PrivateRequest, { query, year }: SpendingSearchParams) =>
  infiniteQueryOptions({
    queryKey: [QUERY_KEYS.SPENDINGS_SEARCH, query, year],
    queryFn: async ({ pageParam }) => {
      const yearParam = year !== null ? `&year=${year}` : "";
      const cursorParam = pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : "";
      const response = await request(`/spendings/search?q=${encodeURIComponent(query)}${yearParam}${cursorParam}`);
      return parseResponse(SpendingSearchPageSchema, response.data, "/spendings/search");
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: false,
    // The modal surfaces failures inline (empty-state message) instead of the
    // error boundary — a broken search must not take down the whole page (opts
    // out of the global throwOnError).
    throwOnError: false,
    // Keep the loaded pages around longer than the default 5 min so returning
    // to the modal (browser Back) after a detour restores the full list, not
    // just the first page (COS-114).
    gcTime: 30 * 60 * 1000,
  });

export const productTypesQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.PRODUCT_TYPES],
    queryFn: async () => {
      const response = await request("/product-types");
      return parseResponse(ProductTypeListSchema, response.data, "/product-types");
    },
  });

export const storesQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.STORES],
    queryFn: async () => {
      const response = await request("/stores");
      return parseResponse(StoreListSchema, response.data, "/stores");
    },
  });

const ReceiptImageSchema = z.string().nullable();

/** A spending's receipt image as a data: URL, or null. Never cached past its modal. */
export const receiptImageQuery = (request: PrivateRequest, spendingID: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECEIPT_IMAGE, spendingID],
    queryFn: async () => {
      const response = await request(`/spendings/upload/${spendingID}?itemType=${itemTypeSchema.enum.spending}`);
      const parsed = ReceiptImageSchema.safeParse(response.data);
      return parsed.success ? parsed.data : null;
    },
    gcTime: 0,
  });

export const receiptLinesQuery = (request: PrivateRequest, spendingID: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECEIPT_LINES, spendingID],
    queryFn: async () => {
      const endpoint = `/spendings/${spendingID}/lines`;
      const response = await request(endpoint);
      return parseResponse(ReceiptLinesResponseSchema, response.data, endpoint);
    },
  });

/** What the OCR reads on a receipt: run once per modal opening, never refetched or cached. */
export const receiptOcrQuery = (request: PrivateRequest, spendingID: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECEIPT_OCR, spendingID],
    queryFn: async () => {
      const endpoint = `/spendings/${spendingID}/lines/ocr`;
      const response = await request(endpoint, { method: "POST" });
      return parseResponse(ReceiptProposalSchema, response.data, endpoint);
    },
    gcTime: 0,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
  });
