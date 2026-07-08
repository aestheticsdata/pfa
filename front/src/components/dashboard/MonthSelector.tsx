"use client";

import addMonths from "date-fns/addMonths";
import addDays from "date-fns/addDays";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import isSameMonth from "date-fns/isSameMonth";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";

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

  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 rounded-[6px] border border-line bg-bg-elev px-2.5 py-[7px] text-[13px] text-ink-2">
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
        <span className="num w-[116px] text-center capitalize tracking-[-0.01em]">
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
      <button
        type="button"
        onClick={() => applyMonth(new Date())}
        disabled={isCurrentMonth}
        className="rounded-[6px] border border-line bg-transparent px-3 py-[7px] text-[13px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2"
      >
        Aujourd&apos;hui
      </button>
    </div>
  );
};

export default MonthSelector;
