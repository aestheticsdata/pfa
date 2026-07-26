"use client";

import useDatePickerState from "@components/datePickerWrapper/helpers/useDatePickerState";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { useLocale } from "@i18n/LocaleContext";
import useDateLocale from "@i18n/useDateLocale";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import localesDates from "@src/i18n/locales-dates";
import format from "date-fns/format";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import DayPicker from "react-day-picker";
// NOTE: react-day-picker/lib/style.css is intentionally NOT imported — the pfa
// "Capsule" styling in globals.css fully styles the DayPicker, and the lib CSS
// (loaded after globals) would otherwise win and reintroduce the blue band,
// triangle nav arrows and white hover box.

import type { Modifiers } from "react-day-picker";

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
  const { locale } = useLocale();
  const { MONTHS, WEEKDAYS_LONG, WEEKDAYS_SHORT } = localesDates[locale];

  const {
    isCalendarVisible,
    hoverRange,
    selectedDays,
    setIsCalendarVisible,
    handleDayChange,
    handleDayEnter,
    handleDayLeave,
  } = useDatePickerState();

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

  return (
    /* The wrapper no longer positions anything (the panel is portalled) — it
       stays because it is what absorbs the stretch of the mobile flex-col
       column, leaving the trigger at its intrinsic width. */
    <div>
      <Popover
        open={isCalendarVisible}
        onOpenChange={setIsCalendarVisible}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex select-none items-center gap-2.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm text-ink-2 shadow-lg transition-colors hover:cursor-pointer",
              isCalendarVisible
                ? "border-accent-d bg-surface-elev"
                : "border-line bg-surface-base hover:border-ink-4 hover:bg-surface-elev",
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-ink-4" />
            {selectedDays.length > 0 ? (
              <span className="num text-sm tracking-snug">
                {format(selectedDays[0], "dd MMM yyyy", { locale: dateLocale })}
                <span className="mx-1 text-ink-5">—</span>
                {format(selectedDays[selectedDays.length - 1], "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </span>
            ) : (
              <span className="text-sm">{common.datePicker.placeholder}</span>
            )}
            <ChevronDown
              className={cn("size-3.5 shrink-0 text-ink-5 transition-transform", isCalendarVisible && "rotate-180")}
            />
          </button>
        </PopoverTrigger>
        {/* Strip the ui/popover chrome (bg/border/padding/shadow): the DayPicker
            owns its own "Capsule" surface in daypicker.css, same arrangement as
            MonthPickerPopover. align="start" reproduces the previous desktop
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
          <DayPicker
            initialMonth={selectedDays[0]}
            locale={locale}
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
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerWrapper;
