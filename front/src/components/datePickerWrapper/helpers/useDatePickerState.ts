"use client";

import useBlur from "@components/common/helpers/blurHelper";
import { getWeekDays, getWeekRange } from "@components/datePickerWrapper/helpers";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_QUERY_PARAM, parseAsSpendingsDate, SPENDINGS_PATH } from "@helpers/dateRoute";
import formatISO from "date-fns/formatISO";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import type { Days, HoverRange } from "@components/datePickerWrapper/types";

const useDatePickerState = () => {
  const { toggleBlur } = useBlur();

  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [hoverRange, setHoverRange] = useState<HoverRange>(null);
  const [selectedDays, setSelectedDays] = useState<Days>([]);

  const pathname = usePathname();
  const [dateInUrl, setDateInUrl] = useQueryState(DATE_QUERY_PARAM, parseAsSpendingsDate);

  const { setFrom, setTo, setRange, setSelectedDateIso, setScrollToDayIso } = useDatePickerWrapperStore();

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
    // A deliberate week pick (updateUrl is only true for a user calendar click,
    // never the programmatic URL sync) supersedes any pending "scroll to a day"
    // request — e.g. a "Today" scroll that never got consumed — so it
    // can't fire later on an unrelated navigation (COS-38).
    if (updateUrl) {
      setScrollToDayIso(null);
    }
    // A deliberate week pick pushes a new history entry so Back returns to the
    // previous week; nuqs leaves any other query param on /spendings untouched.
    if (updateUrl && normalizePath(pathname) === SPENDINGS_PATH && dateInUrl !== dateISO) {
      setDateInUrl(dateISO, { history: "push" });
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
