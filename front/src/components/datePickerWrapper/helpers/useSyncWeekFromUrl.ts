"use client";

import { parseDateParam } from "@components/datePickerWrapper/helpers";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_QUERY_PARAM, parseAsSpendingsDate } from "@helpers/dateRoute";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

/**
 * Mirrors the `?date=` URL param — the source of truth for the selected week —
 * into the picker store. Mount it ONCE per page (the Spendings page client): it
 * used to live inside DatePickerWrapper, which the NavBar renders twice (a
 * desktop and a mobile copy, hidden from each other by CSS only), so every param
 * change was written to the store twice (COS-99).
 *
 * DatePickerWrapper is now purely presentational, which is what makes its double
 * mount harmless.
 */
const useSyncWeekFromUrl = () => {
  const [dateParam] = useQueryState(DATE_QUERY_PARAM, parseAsSpendingsDate);
  const { setWeek } = useDatePickerWrapperStore();

  useEffect(() => {
    // No `?date=` (or an invalid one, which the parser drops to null): fall back
    // to the BROWSER-LOCAL today, never a server-resolved day (COS-73). The page
    // canonicalises the URL to that same day right after, and setWeek no-ops on
    // the week it already holds.
    const date = dateParam ? parseDateParam(dateParam) : new Date();
    if (!Number.isNaN(date.getTime())) {
      setWeek(date);
    }
  }, [dateParam, setWeek]);
};

export default useSyncWeekFromUrl;
