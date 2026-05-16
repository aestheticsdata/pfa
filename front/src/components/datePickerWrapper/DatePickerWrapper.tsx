"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DayPicker from "react-day-picker";
import "react-day-picker/lib/style.css";
import useOnClickOutside from "use-onclickoutside";
import fr from "date-fns/locale/fr";
import format from "date-fns/format";
import { Calendar as CalendarIcon } from "lucide-react";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, MONTHS } from "./locale-fr";
import useDatePickerState from "@components/datePickerWrapper/helpers/useDatePickerState";
import { DATE_QUERY_PARAM } from "@helpers/dateRoute";
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
      const date = new Date(selectedDateParam);
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
        className="px-4 py-2 bg-[#0c0c0c] border border-gray-700/50 rounded-lg hover:bg-[#151515] hover:cursor-pointer transition-colors flex items-center justify-center gap-2 text-gray-200 shadow-lg whitespace-nowrap text-sm select-none"
      >
        <CalendarIcon className="w-4 h-4" />
        {selectedDays.length > 0 ? (
          <span>
            {format(selectedDays[0], "dd MMM yyyy", { locale: fr })} —{" "}
            {format(selectedDays[selectedDays.length - 1], "dd MMM yyyy", {
              locale: fr,
            })}
          </span>
        ) : (
          <span>Sélectionner une période</span>
        )}
      </button>
      {isCalendarVisible && (
        <div className="absolute top-12 right-0 lg:right-auto p-4 rounded-xl drop-shadow-2xl bg-card border border-gray-800/50 shadow-2xl z-50">
          <DayPicker
            initialMonth={selectedDays[0]}
            locale="fr"
            months={MONTHS}
            weekdaysLong={WEEKDAYS_LONG}
            weekdaysShort={WEEKDAYS_SHORT}
            selectedDays={selectedDays}
            showWeekNumbers={false}
            showOutsideDays={false}
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
