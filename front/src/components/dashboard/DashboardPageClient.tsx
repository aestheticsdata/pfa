"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DepensesView from "@components/depenses/DepensesView";
import useGlobalStore from "@components/shared/globalStore";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_QUERY_PARAM, isValidIsoDate } from "@helpers/dateRoute";

export default function DashboardPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { setSelectedDateIso } = useDatePickerWrapperStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    const date = searchParams.get(DATE_QUERY_PARAM) ?? undefined;
    if (isValidIsoDate(date)) {
      setSelectedDateIso(date);
    }
  }, [searchParams, setSelectedDateIso]);

  return <DepensesView />;
}
