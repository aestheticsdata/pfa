"use client";

import { getWeekRange } from "@components/datePickerWrapper/helpers";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_QUERY_PARAM, formatIsoDate, parseAsSpendingsDate, SPENDINGS_PATH } from "@helpers/dateRoute";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import type { HoverRange } from "@components/datePickerWrapper/interfaces/datePickerTypes";

/**
 * View state of a single DatePickerWrapper instance. The selected week is NOT
 * held here — it is read from the shared store, so the desktop and mobile copies
 * of the picker can no longer show different weeks (COS-99). What stays local is
 * strictly the ephemeral UI of the copy the user is interacting with: whether
 * its popover is open and which week the pointer is hovering. Only one copy is
 * ever displayed (the other is `display:none`, so it takes neither clicks nor
 * hovers), so those two cannot diverge in any observable way.
 */
const useDatePickerState = () => {
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [hoverRange, setHoverRange] = useState<HoverRange>(null);

  const pathname = usePathname();
  const [dateInUrl, setDateInUrl] = useQueryState(DATE_QUERY_PARAM, parseAsSpendingsDate);

  const { range, setWeek, setScrollToDayIso } = useDatePickerWrapperStore();

  const normalizePath = (path: string): string => {
    const normalized = path.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
  };

  // Open/close is owned by the Radix popover (trigger click, outside click,
  // Escape) — the hook only holds the state it drives (COS-161).
  const closeCalendar = () => setIsCalendarVisible(false);

  /** A deliberate week pick from the calendar (the only caller). */
  const handleDayChange = (date: Date) => {
    const dateISO = formatIsoDate(date);
    // Supersedes any pending "scroll to a day" request — e.g. a "Today" scroll
    // that never got consumed — so it can't fire later on an unrelated
    // navigation (COS-38).
    setScrollToDayIso(null);
    // Pushes a new history entry so Back returns to the previous week; nuqs
    // leaves any other query param on /spendings untouched. The store is written
    // here rather than waiting for useSyncWeekFromUrl to see the new param, so
    // the view updates in this render; that sync then no-ops on the week it now
    // already holds.
    if (normalizePath(pathname) === SPENDINGS_PATH && dateInUrl !== dateISO) {
      setDateInUrl(dateISO, { history: "push" });
    }
    setWeek(date);

    closeCalendar();
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
    selectedDays: range ?? [],
    setIsCalendarVisible,
    handleDayChange,
    handleDayEnter,
    handleDayLeave,
  };
};

export default useDatePickerState;
