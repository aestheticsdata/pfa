import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, MONTHLY, QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { CategoryTrendsResponseSchema } from "@src/schemas/stats";
import { useQuery } from "@tanstack/react-query";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import subDays from "date-fns/subDays";
import subMonths from "date-fns/subMonths";

import type { CategoryTrendPoint } from "@src/schemas/stats";

// A user category and a global one can share a name; merge those rows by name —
// summing both period totals — then sort by current amount desc, mirroring
// useCharts' old aggregateByCategory but carrying the comparison-period value.
// `previousValue` stays null (a "nouv." category) only when every merged row was.
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

// The current period plus the one it is compared against, per period type. The
// front owns this math (server-timezone-agnostic): monthly = the selected month
// vs the one before it (dashboard, COS-41); weekly = the picked range vs the 7
// days before it (Dépenses, COS-35).
const windows = (periodType: string, from?: Date | null, to?: Date | null) => {
  if (periodType === MONTHLY) {
    if (!from) return null;
    const previousMonth = subMonths(from, 1);
    return {
      current: { from: startOfMonth(from), to: endOfMonth(from) },
      previous: { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) },
    };
  }
  if (!from || !to) return null;
  return {
    current: { from, to },
    previous: { from: subDays(from, 7), to: subDays(to, 7) },
  };
};

/**
 * Per-category spending totals for a period and the one before it, so the UI can
 * show a per-category trend (delta %). `trends` has one row per category with
 * spending in the current period, sorted by amount desc; `previousValue` is null
 * for a category new to the comparison period. `previousTotal` is the whole
 * comparison period's spending — the Dépenses avg/day delta uses it (COS-35).
 * Backs the dashboard's monthly breakdown trend column + "Catégorie en hausse"
 * insight (COS-41), and the Dépenses weekly breakdown (COS-35).
 */
const useCategoryTrends = (periodType: string) => {
  const { privateRequest } = useRequestHelper();
  const { from, to } = useDatePickerWrapperStore();
  const { user } = useAuth();
  const userID = user?.id;
  const range = windows(periodType, from, to);

  const getCategoryTrends = async (): Promise<{ trends: CategoryTrendPoint[]; previousTotal: number }> => {
    if (!range || !userID) return { trends: [], previousTotal: 0 };
    const { current, previous } = range;
    // userID is read from the session (@GetUserId()) server-side, not the query.
    const query = new URLSearchParams({
      from: format(current.from, DATE_FORMAT),
      to: format(current.to, DATE_FORMAT),
      prevFrom: format(previous.from, DATE_FORMAT),
      prevTo: format(previous.to, DATE_FORMAT),
    });
    const response = await privateRequest(`/category-trends?${query}`);
    const parsed = CategoryTrendsResponseSchema.parse(response.data);
    return { trends: aggregateByCategory(parsed.trends), previousTotal: parsed.previousTotal };
  };

  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORY_TRENDS, range?.current.from, range?.current.to],
    queryFn: getCategoryTrends,
    retry: false,
    enabled: !!range && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useCategoryTrends;
