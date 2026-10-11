import { format, getDay, getDaysInMonth, getMonth, getYear } from "date-fns";
import { roundCurrency } from "@stats/helpers/rounding.helper";

import type { DatedAmount, WeekRange } from "@stats/interfaces/statsTypes";

/**
 * Per-week spending totals of the month containing `startDate`, over its
 * calendar-aligned Sun→Sat slices truncated at the month edges.
 */
export function makeRange(monthSpending: DatedAmount[], startDate: Date): number[] {
  const ranges: number[] = [];
  const dayNumberFromMonthStart = getDay(startDate);
  const firstSlice = 7 - dayNumberFromMonthStart;
  const numberOfDaysInMonth = getDaysInMonth(startDate);
  ranges.push(firstSlice);
  const numberOfFullWeeks = Math.floor((numberOfDaysInMonth - firstSlice) / 7);
  for (let i = 0; i < numberOfFullWeeks; i += 1) {
    ranges.push(7);
  }
  const remainingNumberOfDays = numberOfDaysInMonth - (firstSlice + 7 * numberOfFullWeeks);
  if (remainingNumberOfDays !== 0) {
    ranges.push(remainingNumberOfDays);
  }

  const totalsByWeek: number[] = [];
  let dayShifter = 0;
  for (let slice_i = 0; slice_i < ranges.length; slice_i += 1) {
    totalsByWeek[slice_i] = 0;
    let tempTotal = 0;
    for (let day_of_slice_i = 0; day_of_slice_i < ranges[slice_i]; day_of_slice_i += 1) {
      const targetDate = new Date(getYear(startDate), getMonth(startDate), day_of_slice_i + 1 + dayShifter);
      const targetStr = format(targetDate, "yyyy-MM-dd");
      const spendingByDay = monthSpending.filter((o) => format(o.date, "yyyy-MM-dd") === targetStr);
      tempTotal = spendingByDay.reduce((acc, curr) => acc + Number(curr.amount.toString()), 0);
      if (spendingByDay.length !== 0) {
        totalsByWeek[slice_i] = roundCurrency((totalsByWeek[slice_i] ?? 0) + tempTotal);
      }
    }
    dayShifter += ranges[slice_i];
  }
  return totalsByWeek;
}

/**
 * A month's calendar-aligned week slices as inclusive day-of-month ranges: a
 * (possibly short) first slice from day 1 to the first Saturday, full Sun→Sat
 * weeks, then a (possibly short) trailing slice. Same slicing as `makeRange`,
 * but the first slice is derived from the 1st of the month (UTC) so it is
 * correct whatever day `start` falls on.
 */
export function weekRangesOfMonth(year: number, month: number): WeekRange[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const ranges: WeekRange[] = [];
  let day = 1;
  let sliceLength = 7 - firstWeekday;
  while (day <= daysInMonth) {
    const endDay = Math.min(day + sliceLength - 1, daysInMonth);
    ranges.push({ startDay: day, endDay });
    day = endDay + 1;
    sliceLength = 7;
  }
  return ranges;
}
