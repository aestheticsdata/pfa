import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { categoryKey, endOfMonthProjection } from "@components/spendings/helpers/endOfMonthProjection";
import useDailyProjection from "@components/spendings/services/useDailyProjection";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import parseISO from "date-fns/parseISO";

import type { ProjectionSource } from "@src/schemas/dashboard";

interface UseEndOfMonthProjection {
  /** The viewed month's projected end total, or null when there is none to show. */
  projection: number | null;
  /** True when the current month has no reference period to project from — the
   *  user's very first month of data, as opposed to a month that simply cannot
   *  be projected (a past or future one). */
  noHistory: boolean;
  /** What each category still has coming before the month is out, keyed by
   *  `categoryKey`; a category with nothing more expected is absent rather than
   *  zero. These are the very euros the projection above is built from, so a
   *  row and the headline can never tell different stories (PFA-181). */
  remainders: Map<string | null, number>;
  /** Which month the figures above are read from, for the UI to name. "none"
   *  while the reference loads, and at the user's first month of data. */
  source: ProjectionSource;
}

/**
 * The single end-of-month figure the dashboard's cards agree on (PFA-175),
 * together with the per-category remainders it is summed from (PFA-181).
 *
 * It reads the same day-by-day reference the sparkline draws its dashed tail
 * from, so the number and the curve tell the same story. Fixed charges are
 * never extrapolated — a month's recurrings are known in full from day one —
 * and the figure is null rather than zero whenever there is nothing honest to
 * project.
 */
const useEndOfMonthProjection = (): UseEndOfMonthProjection => {
  const { from } = useDatePickerWrapperStore();
  const { monthlyTotal } = useDashboard();
  const { spendingsByMonth } = useSpendings();
  const { data: reference } = useDailyProjection();

  const now = new Date();
  const monthRef = from ?? now;
  const daysInMonth = getDaysInMonth(monthRef);

  // The viewed month's spendings bucketed by category, then by day — parseISO so
  // a date stays on the calendar day it was recorded on, whatever the browser's
  // zone. Bucketing per category is what lets the booked-ahead clamp stay inside
  // a category instead of one category's pre-paid bill cancelling another's
  // estimate.
  const actualsByCategory = new Map<string | null, number[]>();
  for (const spending of spendingsByMonth ?? []) {
    const day = getDate(parseISO(spending.date));
    if (Number.isNaN(day) || day < 1 || day > daysInMonth) continue;
    const key = categoryKey(spending.category);
    let daily = actualsByCategory.get(key);
    if (!daily) {
      daily = new Array<number>(daysInMonth).fill(0);
      actualsByCategory.set(key, daily);
    }
    daily[day - 1] += Number(spending.amount);
  }

  const { total, remainders } = endOfMonthProjection({
    monthlyTotal,
    actualsByCategory,
    projection: reference,
    monthRef,
    now,
  });

  const source = reference?.source ?? "none";

  return {
    projection: total,
    remainders,
    source,
    noHistory: isSameMonth(monthRef, now) && source === "none",
  };
};

export default useEndOfMonthProjection;
