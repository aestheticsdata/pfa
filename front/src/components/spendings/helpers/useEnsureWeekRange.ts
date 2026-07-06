"use client";

import { useEffect } from "react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import {
  getWeekRange,
  getWeekDays,
} from "@components/datePickerWrapper/helpers";

/**
 * Ensures the shared date-picker store has a week range (from/to/range) set,
 * initializing it to the current week if the store is empty (e.g. landing on a
 * page before DatePickerWrapper mounts). Shared by the Dépenses (weekly) and
 * Dashboard (monthly) pages.
 */
const useEnsureWeekRange = () => {
  const { from, setFrom, setTo, setRange } = useDatePickerWrapperStore();

  useEffect(() => {
    if (from) return;
    const now = new Date();
    const weekRange = getWeekRange(now);
    const dateRange = getWeekDays(weekRange.from, now);
    setFrom(weekRange.from);
    setTo(weekRange.to);
    setRange(dateRange);
  }, [from, setFrom, setTo, setRange]);
};

export default useEnsureWeekRange;
