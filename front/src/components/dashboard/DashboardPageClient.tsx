"use client";

import { useEffect } from "react";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import addDays from "date-fns/addDays";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import useGlobalStore from "@components/shared/globalStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import DashboardView from "@components/dashboard/DashboardView";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

/**
 * Dashboard (monthly) page. Uses a MONTH selector — not the weekly date-picker
 * (hidden here). Normalizes the shared date store to whole-month bounds so the
 * monthly hooks read the right period.
 */
export default function DashboardPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { from, to, setFrom, setTo, setRange } = useDatePickerWrapperStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    const alreadyMonth =
      from &&
      to &&
      from.getTime() === startOfMonth(from).getTime() &&
      to.getTime() === endOfMonth(from).getTime();
    if (alreadyMonth) return;
    const base = from ?? new Date();
    const start = startOfMonth(base);
    const end = endOfMonth(base);
    setFrom(start);
    setTo(end);
    setRange(eachDayOfInterval({ start, end: addDays(start, 6) }));
  }, [from, to, setFrom, setTo, setRange]);

  const month: MonthRange | null =
    from && to ? { start: startOfMonth(from), end: endOfMonth(to) } : null;

  if (!month) {
    return null;
  }

  return <DashboardView month={month} />;
}
