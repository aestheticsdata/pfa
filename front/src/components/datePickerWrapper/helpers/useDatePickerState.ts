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

import type { Days, HoverRange } from "@components/datePickerWrapper/types";


const useDatePickerState = () => {
  const { toggleBlur } = useBlur();

  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [hoverRange, setHoverRange] = useState<HoverRange>(null);
  const [selectedDays, setSelectedDays] = useState<Days>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { setFrom, setTo, setRange } = useDatePickerWrapperStore();

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
    if (updateUrl && pathname === "/") {
      const currentDateInUrl = searchParams.get("currentDate");
      if (currentDateInUrl !== dateISO) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("currentDate", dateISO);
        router.push(`/?${params.toString()}`);
      }
    }

    const weekRange = getWeekRange(date);
    const dateRange: Date[] = getWeekDays(weekRange.from, date);

    setFrom(weekRange.from);
    setTo(weekRange.to);
    setRange(dateRange);
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
