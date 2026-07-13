"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useGlobalStore from "@components/shared/globalStore";
import SpendingView from "@components/spendings/view/SpendingView";
import { buildSpendingsPath, DATE_QUERY_PARAM, getTodayIsoDate, isValidIsoDate } from "@helpers/dateRoute";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SpendingPageClient() {
  const { setIsCalendarVisible } = useGlobalStore();
  const { setSelectedDateIso } = useDatePickerWrapperStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  useEffect(() => {
    const date = searchParams.get(DATE_QUERY_PARAM) ?? undefined;
    if (isValidIsoDate(date)) {
      setSelectedDateIso(date);
      return;
    }
    // No/invalid ?date= → default to the BROWSER-LOCAL today and canonicalise the
    // URL. "Today" must be resolved client-side: the server timezone can differ
    // from the user's, so it must never decide the day (COS-73).
    router.replace(buildSpendingsPath(getTodayIsoDate()));
  }, [searchParams, setSelectedDateIso, router]);

  return <SpendingView />;
}
