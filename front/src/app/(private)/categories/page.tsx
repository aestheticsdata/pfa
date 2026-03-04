"use client";

import { useEffect } from "react";
import useGlobalStore from "@components/shared/globalStore";
import CategoriesListcontainer from "@components/categories/CategoriesListcontainer";

export default function Categories() {
  const { setIsCalendarVisible } = useGlobalStore();

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  return <CategoriesListcontainer />;
}
