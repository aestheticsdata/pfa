"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useGlobalStore from "@components/shared/globalStore";
import SpendingView from "@components/spendings/view/SpendingView";
import { DATE_QUERY_PARAM, getTodayIsoDate, parseAsSpendingsDate } from "@helpers/dateRoute";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

export default function SpendingPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { setSelectedDateIso } = useDatePickerWrapperStore();
  // The `?date=` param is the URL source of truth for the selected week; the
  // parser drops any invalid value to null (see parseAsSpendingsDate).
  const [date, setDate] = useQueryState(DATE_QUERY_PARAM, parseAsSpendingsDate);

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    if (date) {
      setSelectedDateIso(date);
      return;
    }
    // No/invalid ?date= → default to the BROWSER-LOCAL today and canonicalise the
    // URL in place (replace, not push). "Today" must be resolved client-side: the
    // server timezone can differ from the user's, so it must never decide the day
    // (COS-73).
    setDate(getTodayIsoDate(), { history: "replace" });
  }, [date, setSelectedDateIso, setDate]);

  return <SpendingView />;
}
