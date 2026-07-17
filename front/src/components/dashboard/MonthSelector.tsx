"use client";

import { IconButton } from "@components/shared/IconButton";
import { formatMonthParam, isValidMonthParam, MONTH_QUERY_PARAM, parseMonthParam } from "@helpers/dateRoute";
import dashboardText from "@text/dashboard";
import addMonths from "date-fns/addMonths";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import startOfMonth from "date-fns/startOfMonth";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState, useSyncExternalStore } from "react";

/**
 * Month period selector shown in the app header on the Dashboard. The month is
 * the URL's ?month= param (single source of truth, COS-118); DashboardPageClient
 * syncs the shared store from it. Landing on the current month clears the param,
 * keeping /dashboard clean.
 */
const MonthSelector = () => {
  const [monthParam, setMonthParam] = useQueryState(MONTH_QUERY_PARAM, parseAsString);
  const isClientHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [currentMonthStart] = useState(() => startOfMonth(new Date()));

  const paramMonth = isValidMonthParam(monthParam ?? "") ? startOfMonth(parseMonthParam(monthParam ?? "")) : null;
  // Fall back to the current month only AFTER hydration: `new Date()` must never
  // decide the rendered month on the server (server UTC ≠ browser tz), or a month
  // boundary would flash the wrong month and throw a hydration mismatch (COS-73).
  // Until then the label is blank (the control keeps its fixed width).
  const month = paramMonth ?? (isClientHydrated ? currentMonthStart : null);

  const stepMonth = (delta: number) => {
    if (!month) return;
    const start = startOfMonth(addMonths(month, delta));
    setMonthParam(start.getTime() === currentMonthStart.getTime() ? null : formatMonthParam(start));
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 rounded-sm border border-line bg-surface-elev px-2.5 py-2 text-sm text-ink-2">
        <Calendar className="size-3.5 text-ink-4" />
        <IconButton
          variant="ghost"
          size={5}
          onClick={() => stepMonth(-1)}
          aria-label={dashboardText.monthSelector.prevMonth}
        >
          <ChevronLeft />
        </IconButton>
        {/* fixed width (fits the longest month, "septembre") so the control
            never resizes as the month changes */}
        <span className="num w-[116px] text-center capitalize tracking-normal">
          {month ? format(month, "MMMM yyyy", { locale: fr }) : ""}
        </span>
        <IconButton
          variant="ghost"
          size={5}
          onClick={() => stepMonth(1)}
          aria-label={dashboardText.monthSelector.nextMonth}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </div>
  );
};

export default MonthSelector;
