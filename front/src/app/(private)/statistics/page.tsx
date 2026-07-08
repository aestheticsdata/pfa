"use client";

import { useEffect } from "react";
import StatisticsView from "@components/statistics/StatisticsView";
import useGlobalStore from "@components/shared/globalStore";

export default function StatisticsPage() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  return <StatisticsView />;
}
