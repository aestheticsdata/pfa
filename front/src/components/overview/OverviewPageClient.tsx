"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import useGlobalStore from "@components/shared/globalStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useEnsureWeekRange from "@components/spendings/helpers/useEnsureWeekRange";
import SpendingDashboard from "@components/spendings/spendingDashboard/SpendingDashboard";
import { DATE_QUERY_PARAM, isValidIsoDate } from "@helpers/dateRoute";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

/**
 * Dashboard (monthly) page — the initial-salary / weekly-ceiling / category
 * charts / fixed-expenses block, split out of the former combined view. Kept in
 * its current styling until the Phase 5 redesign.
 */
export default function OverviewPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { from, to, setSelectedDateIso } = useDatePickerWrapperStore();
  const searchParams = useSearchParams();

  useEnsureWeekRange();

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    const date = searchParams.get(DATE_QUERY_PARAM) ?? undefined;
    if (isValidIsoDate(date)) {
      setSelectedDateIso(date);
    }
  }, [searchParams, setSelectedDateIso]);

  const month: MonthRange | null =
    from && to ? { start: startOfMonth(from), end: endOfMonth(to) } : null;

  if (!month) {
    return null;
  }

  return <SpendingDashboard month={month} />;
}
