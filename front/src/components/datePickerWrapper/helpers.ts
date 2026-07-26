import addDays from "date-fns/addDays";
import endOfWeek from "date-fns/endOfWeek";
import getDate from "date-fns/getDate";
import getDay from "date-fns/getDay";
import isSameMonth from "date-fns/isSameMonth";
import lastDayOfMonth from "date-fns/lastDayOfMonth";
import parseISO from "date-fns/parseISO";
import setHours from "date-fns/setHours";
import startOfMonth from "date-fns/startOfMonth";
import startOfWeek from "date-fns/startOfWeek";
import subDays from "date-fns/subDays";

import type { WeekRange } from "@components/datePickerWrapper/interfaces/datePickerTypes";

/**
 * Parse a date-only ISO string (e.g. the `?date=` URL param "2026-07-12") as a
 * LOCAL date. `new Date("2026-07-12")` parses it as UTC midnight, which rolls
 * back to the previous calendar day in timezones west of UTC and then makes
 * getWeekRange return the previous week (COS-73). parseISO keeps it local,
 * consistent with the rest of the app's date handling.
 */
export const parseDateParam = (isoDate: string): Date => parseISO(isoDate);

export const getWeekDays = (weekStart: Date, date: Date): Date[] => {
  const days: Date[] = [weekStart];

  if (!isSameMonth(startOfWeek(date), date) || !isSameMonth(endOfWeek(date), date)) {
    if (getDate(date) > 15) {
      for (let i = 1; i <= getDay(lastDayOfMonth(date)); i += 1) {
        days.push(addDays(weekStart, i));
      }
    } else {
      for (let i = 1; i <= 6 - getDay(weekStart); i += 1) {
        days.push(addDays(weekStart, i));
      }
    }
  } else {
    for (let i = 1; i < 7; i += 1) {
      days.push(addDays(weekStart, i));
    }
  }

  return days;
};

export const getWeekRange = (date: Date): WeekRange => {
  let dateRange: WeekRange;

  if (!isSameMonth(startOfWeek(date), date) || !isSameMonth(endOfWeek(date), date)) {
    if (getDate(date) > 15) {
      dateRange = {
        // setHours force the 'from" to be at midnight and not noon
        from: setHours(subDays(date, getDay(date)), 0),
        to: lastDayOfMonth(date),
      };
    } else {
      dateRange = {
        from: startOfMonth(date),
        to: endOfWeek(date),
      };
    }
  } else {
    dateRange = {
      from: startOfWeek(date),
      to: endOfWeek(date),
    };
  }

  return dateRange;
};
