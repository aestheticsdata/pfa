"use client";

import useGlobalStore from "@components/shared/globalStore";
import StatisticsView from "@components/statistics/StatisticsView";
import { useEffect } from "react";

export default function StatisticsPage() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  return <StatisticsView />;
}
