import { getDate, getDay, getDaysInMonth, startOfMonth } from "date-fns";

import type { WeekSlice } from "#dates/interfaces/weekTypes";

/** Sunday is day 0 for date-fns' `getDay`, and the first day of PFA's week. */
const DAYS_PER_WEEK = 7;

/**
 * PFA's week model, the one the web uses everywhere (`makeRange`): calendar weeks running Sunday →
 * Saturday, truncated to the month. June 2026 starts on a Monday, so its weeks are 1–6, 7–13,
 * 14–20, 21–27, 28–30. Returns the length of each week, in days.
 */
export const weekLengths = (anyDayOfMonth: Date) => {
  const monthStart = startOfMonth(anyDayOfMonth);
  const firstWeek = DAYS_PER_WEEK - getDay(monthStart);
  const daysInMonth = getDaysInMonth(monthStart);
  const fullWeeks = Math.floor((daysInMonth - firstWeek) / DAYS_PER_WEEK);
  const lastWeek = daysInMonth - firstWeek - fullWeeks * DAYS_PER_WEEK;

  return [firstWeek, ...Array.from({ length: fullWeeks }, () => DAYS_PER_WEEK), ...(lastWeek > 0 ? [lastWeek] : [])];
};

/** The same weeks as day-of-month bounds: `[{ start: 1, end: 6 }, { start: 7, end: 13 }, …]`. */
export const weekSlices = (anyDayOfMonth: Date): WeekSlice[] => {
  let start = 1;
  return weekLengths(anyDayOfMonth).map((length) => {
    const slice = { start, end: start + length - 1 };
    start += length;
    return slice;
  });
};

/** The slice holding `day`, or undefined when the day is outside the month the slices describe. */
export const weekSliceOf = (slices: readonly WeekSlice[], day: Date) => {
  const dayOfMonth = getDate(day);
  return slices.find((slice) => dayOfMonth >= slice.start && dayOfMonth <= slice.end);
};
