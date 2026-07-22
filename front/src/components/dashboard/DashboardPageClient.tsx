"use client";

import DashboardView from "@components/dashboard/DashboardView";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useGlobalStore from "@components/shared/globalStore";
import { isValidMonthParam, MONTH_QUERY_PARAM, parseMonthParam } from "@helpers/dateRoute";
import { endOfMonth } from "date-fns";
import addDays from "date-fns/addDays";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import startOfMonth from "date-fns/startOfMonth";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useLayoutEffect, useState } from "react";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

// Sync the store before paint on the client so stepping months / Back never flash
// a stale month; a plain effect on the server (layout effects don't run in SSR).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Dashboard (monthly) page. The viewed month is the URL's ?month=YYYY-MM param
 * (single source of truth), defaulting to the current month resolved CLIENT-side
 * (COS-73) — so /dashboard always shows the current month and is never polluted
 * by the week a previous Spendings visit left in the shared store (COS-118). We
 * sync that store (the monthly hooks read from/to) and only render once it
 * reflects the URL month, so the hooks never fire against a stale week.
 */
export default function DashboardPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { from, to, setFrom, setTo, setRange } = useDatePickerWrapperStore();
  const [monthParam] = useQueryState(MONTH_QUERY_PARAM, parseAsString);
  const [currentMonthStart] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  const param = monthParam ?? "";
  const targetStart = isValidMonthParam(param) ? startOfMonth(parseMonthParam(param)) : currentMonthStart;
  const targetEnd = endOfMonth(targetStart);
  const storeMatchesTarget = from?.getTime() === targetStart.getTime() && to?.getTime() === targetEnd.getTime();

  useIsomorphicLayoutEffect(() => {
    if (storeMatchesTarget) return;
    const start = isValidMonthParam(param) ? startOfMonth(parseMonthParam(param)) : currentMonthStart;
    const end = endOfMonth(start);
    setFrom(start);
    setTo(end);
    setRange(eachDayOfInterval({ start, end: addDays(start, 6) }));
  }, [storeMatchesTarget, param, currentMonthStart, setFrom, setTo, setRange]);

  if (!storeMatchesTarget) {
    return null;
  }

  const month: MonthRange = { start: targetStart, end: targetEnd };
  return <DashboardView month={month} />;
}
