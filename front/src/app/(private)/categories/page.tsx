"use client";

import CategoriesListcontainer from "@components/categories/CategoriesListcontainer";
import useGlobalStore from "@components/shared/globalStore";
import { useEffect } from "react";

export default function Categories() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  return <CategoriesListcontainer />;
}
