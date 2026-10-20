"use client";

import WeekPickerCalendar from "@components/datePickerWrapper/calendar/WeekPickerCalendar";
import useDatePickerState from "@components/datePickerWrapper/helpers/useDatePickerState";
import { IconButton } from "@components/shared/IconButton";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import useDateLocale from "@i18n/useDateLocale";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Presentational only: it renders the week held by the shared store and never
 * writes it on its own (the URL → store sync lives in useSyncWeekFromUrl, mounted
 * once by the page). The NavBar renders this component TWICE — a desktop and a
 * mobile copy, hidden from each other by CSS, so both are always mounted — which
 * is harmless precisely because it owns no derived state (COS-99).
 */
const DatePickerWrapper = () => {
  const common = useTranslations("common");
  const dateLocale = useDateLocale();

  const { isCalendarVisible, selectedDays, setIsCalendarVisible, handleDayChange, stepWeek } = useDatePickerState();

  const daysAreSelected = selectedDays.length > 0;

  return (
    /* The wrapper no longer positions anything (the panel is portalled) — it
       stays because it is what absorbs the stretch of the mobile flex-col
       column, leaving the trigger at its intrinsic width. */
    <div>
      <Popover
        open={isCalendarVisible}
        onOpenChange={setIsCalendarVisible}
      >
        {/* The ‹ › arrows sit beside the trigger, never inside it (no nested
            buttons); the anchor keeps the panel aligned on the whole handle. */}
        <PopoverAnchor asChild>
          <div
            className={cn(
              "inline-flex select-none items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm text-ink-2 shadow-lg transition-colors",
              isCalendarVisible ? "border-accent-d bg-surface-elev" : "border-line bg-surface-base hover:border-ink-4",
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-ink-4" />
            <IconButton
              variant="ghost"
              size={5}
              onClick={() => stepWeek(-1)}
              disabled={!daysAreSelected}
              aria-label={common.datePicker.prevWeek}
            >
              <ChevronLeft />
            </IconButton>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-testid="week-picker"
                className="inline-flex items-center gap-2.5 rounded-sm px-1 py-0.5 transition-colors hover:cursor-pointer hover:text-ink"
              >
                {daysAreSelected ? (
                  <span className="num text-sm tracking-snug">
                    <span className="inline-block w-week-date text-center">
                      {format(selectedDays[0], "dd MMM yyyy", { locale: dateLocale })}
                    </span>
                    <span className="mx-1 text-ink-5">—</span>
                    <span className="inline-block w-week-date text-center">
                      {format(selectedDays[selectedDays.length - 1], "dd MMM yyyy", { locale: dateLocale })}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm">{common.datePicker.placeholder}</span>
                )}
                <ChevronDown
                  className={cn("size-3.5 shrink-0 text-ink-5 transition-transform", isCalendarVisible && "rotate-180")}
                />
              </button>
            </PopoverTrigger>
            <IconButton
              variant="ghost"
              size={5}
              onClick={() => stepWeek(1)}
              disabled={!daysAreSelected}
              aria-label={common.datePicker.nextWeek}
            >
              <ChevronRight />
            </IconButton>
          </div>
        </PopoverAnchor>
        {/* Strip the ui/popover chrome (bg/border/padding/shadow): the calendar
            owns its own "Capsule" surface, same arrangement as MonthPickerPopover. align="start" reproduces the previous desktop
            anchoring; collisionPadding shifts it back into view on mobile, where
            it used to be hard-coded to right-0. */}
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          // Marks this panel as a navbar overlay: raises the page blur (COS-161).
          data-nav-overlay
          className="w-auto border-0 bg-transparent p-0 shadow-none"
        >
          <WeekPickerCalendar
            selectedDays={selectedDays}
            onSelectDay={handleDayChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerWrapper;
