"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DayPicker from "react-day-picker";
// NOTE: react-day-picker/lib/style.css is intentionally NOT imported — the pfa
// "Capsule" styling in globals.css fully styles the DayPicker, and the lib CSS
// (loaded after globals) would otherwise win and reintroduce the blue band,
// triangle nav arrows and white hover box.
import useOnClickOutside from "use-onclickoutside";
import fr from "date-fns/locale/fr";
import format from "date-fns/format";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, MONTHS } from "./locale-fr";
import useDatePickerState from "@components/datePickerWrapper/helpers/useDatePickerState";
import { parseDateParam } from "@components/datePickerWrapper/helpers";
import { DATE_QUERY_PARAM } from "@helpers/dateRoute";
import { cn } from "@lib/utils";
import type { Modifiers } from "react-day-picker";

const DatePickerWrapper = () => {
  const {
    isCalendarVisible,
    hoverRange,
    selectedDays,
    toggleCalendar,
    handleClickOutside,
    handleDayChange,
    handleDayEnter,
    handleDayLeave,
  } = useDatePickerState();

  const searchParams = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);

  const selectedDateParam = searchParams.get(DATE_QUERY_PARAM);

  const daysAreSelected = selectedDays.length > 0;

  const modifiers: Partial<Modifiers> = {};
  if (hoverRange) {
    modifiers.hoverRange = hoverRange;
    modifiers.hoverRangeStart = hoverRange.from;
    modifiers.hoverRangeEnd = hoverRange.to;
  }
  if (daysAreSelected) {
    modifiers.selectedRange = {
      from: selectedDays[0],
      to: selectedDays[selectedDays.length - 1],
    };
    modifiers.selectedRangeStart = selectedDays[0];
    modifiers.selectedRangeEnd = selectedDays[selectedDays.length - 1];
  }

  useOnClickOutside(ref as React.RefObject<HTMLElement>, handleClickOutside);

  useEffect(() => {
    if (selectedDateParam) {
      const date = parseDateParam(selectedDateParam);
      if (
        !Number.isNaN(date.getTime())
        && (selectedDays.length === 0
          || selectedDays[0].getTime() !== date.getTime())
      ) {
        handleDayChange(date, false);
      }
    } else if (selectedDays.length === 0) {
      handleDayChange(new Date(), false);
    }
  }, [selectedDateParam]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleCalendar}
        className={cn(
          "inline-flex select-none items-center gap-2.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-sm text-gray-200 shadow-lg transition-colors hover:cursor-pointer",
          isCalendarVisible
            ? "border-accent-d bg-[#151515]"
            : "border-gray-700/50 bg-[#0c0c0c] hover:border-gray-600 hover:bg-[#151515]",
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-gray-400" />
        {selectedDays.length > 0 ? (
          <span className="num text-[13.5px] tracking-[-0.01em]">
            {format(selectedDays[0], "dd MMM yyyy", { locale: fr })}
            <span className="mx-[3px] text-gray-500">—</span>
            {format(selectedDays[selectedDays.length - 1], "dd MMM yyyy", {
              locale: fr,
            })}
          </span>
        ) : (
          <span className="text-[13.5px]">Sélectionner une période</span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-gray-500 transition-transform",
            isCalendarVisible && "rotate-180",
          )}
        />
      </button>
      {isCalendarVisible && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 lg:right-auto">
          <DayPicker
            initialMonth={selectedDays[0]}
            locale="fr"
            months={MONTHS}
            weekdaysLong={WEEKDAYS_LONG}
            weekdaysShort={WEEKDAYS_SHORT}
            selectedDays={selectedDays}
            showWeekNumbers={false}
            showOutsideDays
            modifiers={modifiers}
            onDayClick={(day) => handleDayChange(day)}
            onDayMouseEnter={handleDayEnter}
            onDayMouseLeave={handleDayLeave}
            onWeekClick={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default DatePickerWrapper;
