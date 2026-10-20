"use client";

import { monthWeeks } from "@components/datePickerWrapper/helpers";
import useDateLocale from "@i18n/useDateLocale";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { addMonths, format, isSameDay, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface WeekPickerCalendarProps {
  /** The selected week's days (Sunday→Saturday, truncated to its month). */
  selectedDays: Date[];
  onSelectDay: (day: Date) => void;
}

const NAV_BUTTON =
  "grid size-6.5 cursor-pointer place-items-center rounded-sm text-ink-3 transition-colors hover:bg-surface-hi hover:text-ink [&_svg]:size-3.5";

/**
 * The week picker's calendar (PFA-245, replaces react-day-picker 7 and its "Capsule" stylesheet):
 * a month of Sunday-first weeks where hovering a row highlights the week and clicking a day picks
 * the week it belongs to. The selected week is drawn as a soft band with a pastille on each end;
 * today's numeral is electric blue. Days of the neighbouring months are shown, dimmed, and inert.
 * Mounted with the popover, so it opens on the selected week's month every time.
 */
const WeekPickerCalendar = ({ selectedDays, onSelectDay }: WeekPickerCalendarProps) => {
  const common = useTranslations("common");
  const dateLocale = useDateLocale();
  const [month, setMonth] = useState(() => startOfMonth(selectedDays[0] ?? new Date()));

  const weeks = monthWeeks(month);
  const first = selectedDays[0];
  const last = selectedDays[selectedDays.length - 1];
  const isSelected = (day: Date) => selectedDays.some((selected) => isSameDay(selected, day));

  return (
    <div className="w-69 select-none rounded-xl border border-line bg-surface-elev p-3 pb-3.25 text-ink shadow-calendar">
      <div className="mb-2 flex min-h-5.5 items-center justify-between px-0.5">
        <span className="text-compact font-medium capitalize tracking-snug">
          {format(month, "LLLL yyyy", { locale: dateLocale })}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            data-testid="week-picker-prev-month"
            className={NAV_BUTTON}
            onClick={() => setMonth((current) => addMonths(current, -1))}
            aria-label={common.datePicker.prevMonth}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            data-testid="week-picker-next-month"
            className={NAV_BUTTON}
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label={common.datePicker.nextMonth}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="mb-0.5 grid grid-cols-7">
        {weeks[0].map((day) => (
          <abbr
            key={day.getDay()}
            title={format(day, "EEEE", { locale: dateLocale })}
            className="flex justify-center pt-0.5 pb-1 text-2xs font-medium capitalize text-ink-4 no-underline"
          >
            {format(day, "EEEEEE", { locale: dateLocale })}
          </abbr>
        ))}
      </div>

      <div className="grid gap-y-0.5">
        {weeks.map((week) => (
          <div
            key={week[0].getTime()}
            className="group/week grid grid-cols-7"
          >
            {week.map((day, index) => {
              const inMonth = isSameMonth(day, month);
              const selected = inMonth && isSelected(day);
              const isStart = selected && isSameDay(day, first);
              const isEnd = selected && isSameDay(day, last);
              const cell = cn(
                "relative grid h-8.25 place-items-center font-mono text-compact tabular-nums group-hover/week:bg-white/5",
                index === 0 && "group-hover/week:rounded-l-md",
                index === 6 && "group-hover/week:rounded-r-md",
              );

              if (!inMonth) {
                return (
                  <span
                    key={day.getTime()}
                    className={cn(cell, "text-ink-5")}
                  >
                    {format(day, "d")}
                  </span>
                );
              }

              return (
                <button
                  key={day.getTime()}
                  type="button"
                  data-testid="week-picker-day"
                  data-date={format(day, "yyyy-MM-dd")}
                  aria-label={format(day, "PPPP", { locale: dateLocale })}
                  aria-pressed={selected}
                  onClick={() => onSelectDay(day)}
                  className={cn(
                    cell,
                    "cursor-pointer hover:underline hover:decoration-accent-strong hover:decoration-2 hover:underline-offset-4",
                    (isStart || isEnd) && "font-semibold text-primary-foreground",
                    isToday(day) && "font-semibold text-elec",
                  )}
                >
                  {selected && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 bg-accent-strong/18",
                        isStart && "left-1 rounded-l-md",
                        isEnd && "right-1 rounded-r-md",
                      )}
                    />
                  )}
                  {(isStart || isEnd) && (
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-1/2 size-7 -translate-1/2 rounded-full bg-accent-strong"
                    />
                  )}
                  <span className="relative">{format(day, "d")}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekPickerCalendar;
