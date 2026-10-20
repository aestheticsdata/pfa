import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, MONTHLY } from "@components/spendings/config/constants";
import { categoryTrendsQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";

import type { PeriodType } from "@components/spendings/interfaces/periodTypes";
import type { CategoryTrendsWindows, DateBounds } from "@components/spendings/interfaces/spendingQueryTypes";

// The current period plus the one it is compared against, per period type. The
// front owns this math (server-timezone-agnostic): monthly = the selected month
// vs the one before it (dashboard, COS-41); weekly = the picked range vs the 7
// days before it (Spendings, COS-35).
const bounds = (from: Date, to: Date): DateBounds => ({ from: format(from, DATE_FORMAT), to: format(to, DATE_FORMAT) });

const windows = (periodType: PeriodType, from?: Date | null, to?: Date | null): CategoryTrendsWindows | null => {
  if (periodType === MONTHLY) {
    if (!from) return null;
    const previousMonth = subMonths(from, 1);
    return {
      current: bounds(startOfMonth(from), endOfMonth(from)),
      previous: bounds(startOfMonth(previousMonth), endOfMonth(previousMonth)),
    };
  }
  if (!from || !to) return null;
  return {
    current: bounds(from, to),
    previous: bounds(subDays(from, 7), subDays(to, 7)),
  };
};

/**
 * Per-category spending totals for a period and the one before it, so the UI can
 * show a per-category trend (delta %). `trends` has one row per category with
 * spending in the current period, sorted by amount desc; `previousValue` is null
 * for a category new to the comparison period. `previousTotal` is the whole
 * comparison period's spending — the Spendings avg/day delta uses it (COS-35).
 * Backs the dashboard's monthly breakdown trend column + "Rising category"
 * insight (COS-41), and the Spendings weekly breakdown (COS-35).
 */
const useCategoryTrends = (periodType: PeriodType) => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  const to = useDatePickerWrapperStore((state) => state.to);
  return useQuery(categoryTrendsQuery(privateRequest, windows(periodType, from, to)));
};

export default useCategoryTrends;
