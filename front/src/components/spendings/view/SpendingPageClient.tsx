"use client";

import useSyncWeekFromUrl from "@components/datePickerWrapper/helpers/useSyncWeekFromUrl";
import useGlobalStore from "@components/shared/globalStore";
import SpendingView from "@components/spendings/view/SpendingView";
import { DATE_QUERY_PARAM, getTodayIsoDate, parseAsSpendingsDate } from "@helpers/dateRoute";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

export default function SpendingPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  // The `?date=` param is the URL source of truth for the selected week; the
  // parser drops any invalid value to null (see parseAsSpendingsDate).
  const [date, setDate] = useQueryState(DATE_QUERY_PARAM, parseAsSpendingsDate);

  // Sole writer of the week into the shared store, here rather than in the
  // (twice-mounted) DatePickerWrapper — see the hook (COS-99). It also seeds the
  // store when the param is still missing, so the page never renders weekless.
  useSyncWeekFromUrl();

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    if (date) {
      return;
    }
    // No/invalid ?date= → default to the BROWSER-LOCAL today and canonicalise the
    // URL in place (replace, not push). "Today" must be resolved client-side: the
    // server timezone can differ from the user's, so it must never decide the day
    // (COS-73).
    setDate(getTodayIsoDate(), { history: "replace" });
  }, [date, setDate]);

  return <SpendingView />;
}
