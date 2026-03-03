"use client";

import { useEffect } from "react";
import Statistics from "@components/statistics/Statistics";
import useGlobalStore from "@components/shared/globalStore";

export default function StatisticsPage() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  return <Statistics />;
}
