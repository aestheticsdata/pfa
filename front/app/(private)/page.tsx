"use client";

import { useEffect } from "react";
import Spendings from "@components/spendings/Spendings";
import useGlobalStore from "@components/shared/globalStore";

export default function Home() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(true);
  }, [setIsCalendarVisible]);

  return <Spendings />;
}
