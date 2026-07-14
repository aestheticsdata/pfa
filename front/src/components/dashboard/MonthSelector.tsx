"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import addDays from "date-fns/addDays";
import addMonths from "date-fns/addMonths";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import startOfMonth from "date-fns/startOfMonth";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Month period selector shown in the app header on the Dashboard (mirrors the
 * `.period` control in the mockup). Drives the shared date store to whole-month
 * bounds, which every monthly hook (useDashboard / useWeeklyStats / useCharts /
 * useReccurings) reads from.
 */
const MonthSelector = () => {
  const { from, setFrom, setTo, setRange } = useDatePickerWrapperStore();
  const month = from ? startOfMonth(from) : startOfMonth(new Date());

  const applyMonth = (target: Date) => {
    const start = startOfMonth(target);
    const end = endOfMonth(target);
    setFrom(start);
    setTo(end);
    // keep a valid 7-day range around for any hook that still reads it
    setRange(eachDayOfInterval({ start, end: addDays(start, 6) }));
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 rounded-sm border border-line bg-bg-elev px-2.5 py-2 text-sm text-ink-2">
        <Calendar className="size-3.5 text-ink-4" />
        <button
          type="button"
          onClick={() => applyMonth(addMonths(month, -1))}
          aria-label="Mois précédent"
          className="grid size-5 place-items-center rounded text-ink-4 transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </button>
        {/* fixed width (fits the longest month, "septembre") so the control
            never resizes as the month changes */}
        <span className="num w-[116px] text-center capitalize tracking-normal">
          {format(month, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          type="button"
          onClick={() => applyMonth(addMonths(month, 1))}
          aria-label="Mois suivant"
          className="grid size-5 place-items-center rounded text-ink-4 transition-colors hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MonthSelector;
