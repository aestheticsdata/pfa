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
 * Month period selector for the Dashboard (replaces the weekly date-picker).
 * Drives the shared date store to whole-month bounds, which every monthly hook
 * (useDashboard / useWeeklyStats / useCharts / useReccurings) reads from.
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
      <div className="flex items-center gap-1 rounded-md border border-line bg-bg-elev px-1.5 py-1 text-sm text-ink">
        <Calendar className="mx-1 size-3.5 text-ink-4" />
        <button
          type="button"
          onClick={() => applyMonth(addMonths(month, -1))}
          aria-label="Mois précédent"
          className="grid size-6 place-items-center rounded text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[104px] text-center capitalize num tracking-[-0.01em]">
          {format(month, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          type="button"
          onClick={() => applyMonth(addMonths(month, 1))}
          aria-label="Mois suivant"
          className="grid size-6 place-items-center rounded text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => applyMonth(new Date())}
        disabled={isCurrentMonth}
        className="rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
      >
        Aujourd&apos;hui
      </button>
    </div>
  );
};

export default MonthSelector;
