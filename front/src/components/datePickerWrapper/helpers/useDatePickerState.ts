"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import formatISO from "date-fns/formatISO";
import {
  getWeekDays,
  getWeekRange,
} from "@components/datePickerWrapper/helpers";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useBlur from "@components/common/helpers/blurHelper";
import { DASHBOARD_PATH, DATE_QUERY_PARAM } from "@helpers/dateRoute";

import type { Days, HoverRange } from "@components/datePickerWrapper/types";


const useDatePickerState = () => {
  const { toggleBlur } = useBlur();

  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [hoverRange, setHoverRange] = useState<HoverRange>(null);
  const [selectedDays, setSelectedDays] = useState<Days>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { setFrom, setTo, setRange, setSelectedDateIso } = useDatePickerWrapperStore();

  const normalizePath = (path: string): string => {
    const normalized = path.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
  };

  const toggleCalendar = () => {
    toggleBlur();
    setIsCalendarVisible(!isCalendarVisible);
  };

  const handleClickOutside = () => {
    isCalendarVisible && toggleBlur();
    setIsCalendarVisible(false);
  };

  const handleDayChange = (date: Date, updateUrl = true) => {
    const dateISO = formatISO(date, { representation: "date" });
    if (updateUrl && normalizePath(pathname) === DASHBOARD_PATH) {
      const dateInUrl = searchParams.get(DATE_QUERY_PARAM);
      if (dateInUrl !== dateISO) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(DATE_QUERY_PARAM, dateISO);
        router.push(`${DASHBOARD_PATH}?${params.toString()}`);
      }
    }

    const weekRange = getWeekRange(date);
    const dateRange: Date[] = getWeekDays(weekRange.from, date);

    setFrom(weekRange.from);
    setTo(weekRange.to);
    setRange(dateRange);
    setSelectedDateIso(dateISO);
    setSelectedDays(dateRange);

    handleClickOutside();
  };

  const handleDayEnter = (date: Date) => {
    setHoverRange(getWeekRange(date));
  };

  const handleDayLeave = () => {
    setHoverRange(null);
  };

  return {
    isCalendarVisible,
    hoverRange,
    selectedDays,
    setHoverRange,
    setSelectedDays,
    toggleCalendar,
    handleClickOutside,
    handleDayChange,
    handleDayEnter,
    handleDayLeave,
  };
};

export default useDatePickerState;
