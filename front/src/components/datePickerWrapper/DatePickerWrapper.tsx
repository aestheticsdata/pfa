"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import DayPicker from "react-day-picker";
import "react-day-picker/lib/style.css";
import useOnClickOutside from "use-onclickoutside";
import fr from "date-fns/locale/fr";
import format from "date-fns/format";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, MONTHS } from "./locale-fr";
import useDatePickerState from "@components/datePickerWrapper/helpers/useDatePickerState";

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
  
  // Mémoriser la valeur de currentDate pour éviter les re-renders inutiles
  // Utiliser searchParams.toString() pour obtenir une représentation stable
  const currentDate = useMemo(() => searchParams.get("currentDate"), [searchParams.toString()]);

  const daysAreSelected = selectedDays.length > 0;

  const modifiers: any = {
    hoverRange,
    selectedRange: daysAreSelected && {
      from: selectedDays[0],
      to: selectedDays[selectedDays.length - 1],
    },
    hoverRangeStart: hoverRange && hoverRange.from,
    hoverRangeEnd: hoverRange && hoverRange.to,
    selectedRangeStart: daysAreSelected && selectedDays[0],
    selectedRangeEnd: daysAreSelected && selectedDays[selectedDays.length - 1],
  };

  useOnClickOutside(ref as React.RefObject<HTMLElement>, handleClickOutside);

  useEffect(() => {
    if (currentDate) {
      const date = new Date(currentDate as string);
      // Vérifier si la date a vraiment changé pour éviter les boucles infinies
      if (selectedDays.length === 0 || selectedDays[0].getTime() !== date.getTime()) {
        handleDayChange(date);
      }
    } else if (selectedDays.length === 0) {
      // Seulement si aucune date n'est sélectionnée
      handleDayChange(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-start bg-grey3 relative m-1"
    >
      <div
        className="text-datePickerWrapper bg-datePickerWrapperBackground rounded-sm px-2 select-none cursor-pointer hover:brightness-125"
        onClick={toggleCalendar}
      >
        {selectedDays.length > 0 ? (
          <div>
            {format(selectedDays[0], "dd MMM yyyy", { locale: fr })} –{" "}
            {format(selectedDays[selectedDays.length - 1], "dd MMM yyyy", {
              locale: fr,
            })}
          </div>
        ) : (
          <div>dates</div>
        )}
      </div>
        {isCalendarVisible && (
          <div className="absolute top-8 p-4 rounded-sm drop-shadow-2xl bg-blueNavy">
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
              onDayClick={handleDayChange}
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
