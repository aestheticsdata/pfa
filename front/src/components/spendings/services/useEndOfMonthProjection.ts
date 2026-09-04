import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { endOfMonthProjection } from "@components/spendings/helpers/endOfMonthProjection";
import useDailyProjection from "@components/spendings/services/useDailyProjection";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isSameMonth from "date-fns/isSameMonth";
import parseISO from "date-fns/parseISO";

interface UseEndOfMonthProjection {
  /** The viewed month's projected end total, or null when there is none to show. */
  projection: number | null;
  /** True when the current month has no reference period to project from — the
   *  user's very first month of data, as opposed to a month that simply cannot
   *  be projected (a past or future one). */
  noHistory: boolean;
}

/**
 * The single end-of-month figure the dashboard's cards agree on (PFA-175).
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

  // The viewed month's spendings bucketed by day — parseISO so a date stays on
  // the calendar day it was recorded on, whatever the browser's zone.
  const dailyActuals = new Array<number>(getDaysInMonth(monthRef)).fill(0);
  for (const spending of spendingsByMonth ?? []) {
    const day = getDate(parseISO(spending.date));
    if (!Number.isNaN(day) && day >= 1 && day <= dailyActuals.length) {
      dailyActuals[day - 1] += Number(spending.amount);
    }
  }

  return {
    projection: endOfMonthProjection({ monthlyTotal, dailyActuals, projection: reference, monthRef, now }),
    noHistory: isSameMonth(monthRef, now) && (reference?.source ?? "none") === "none",
  };
};

export default useEndOfMonthProjection;
