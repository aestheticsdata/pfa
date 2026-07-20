"use client";

import { IconButton } from "@components/shared/IconButton";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";
import dashboardText from "@text/dashboard";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const { monthSelector: text } = dashboardText;

type MonthPickerPopoverProps = {
  /** First day of the currently viewed month, or `null` before hydration. */
  month: Date | null;
  /** First day of the real current month (client-resolved, COS-73). */
  currentMonthStart: Date;
  /** Jump straight to `target`'s month (writes ?month=, clearing when current). */
  onSelectMonth: (target: Date) => void;
};

/**
 * Direct year + month picker behind the Dashboard month label (COS-120). The
 * label is the popover trigger; the panel is a year stepper over a 3×4 grid of
 * months, so any month is one jump away — no arrow-mashing burst of month-keyed
 * requests. Bounds mirror the arrows (unbounded), adding no new reachability.
 */
const MonthPickerPopover = ({ month, currentMonthStart, onSelectMonth }: MonthPickerPopoverProps) => {
  const [open, setOpen] = useState(false);
  // Year shown in the grid header. Reset to the viewed month's year on every open
  // so the panel always starts where the user currently is.
  const [gridYear, setGridYear] = useState(() => (month ?? currentMonthStart).getFullYear());

  const label = month ? format(month, "MMMM yyyy", { locale: fr }) : "";

  const handleOpenChange = (next: boolean) => {
    if (next) setGridYear((month ?? currentMonthStart).getFullYear());
    setOpen(next);
  };

  const selectMonth = (target: Date) => {
    onSelectMonth(target);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      {/* Trigger = the month label itself (no caret — matches the datepicker).
          Fixed width from the spacing scale (w-36 holds the longest "MMMM yyyy",
          "septembre 2025", in mono) so the control never resizes between months;
          whitespace-nowrap keeps it on one line — a wrapped label grows the navbar. */}
      <PopoverTrigger
        aria-label={text.chooseMonth(label)}
        className="num w-36 cursor-pointer whitespace-nowrap rounded-sm px-1 py-0.5 text-center text-sm capitalize tracking-normal text-ink-2 transition-colors hover:text-ink"
      >
        {label}
      </PopoverTrigger>
      {/* Strip the ui/popover chrome (bg/border/padding/shadow) so the inner
          .pfa-card owns the surface, matching every other private-screen panel. */}
      <PopoverContent
        align="center"
        sideOffset={8}
        collisionPadding={8}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <div className="pfa-card w-[248px] p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <IconButton
              variant="ghost"
              size={6}
              onClick={() => setGridYear((year) => year - 1)}
              aria-label={text.prevYear}
            >
              <ChevronLeft />
            </IconButton>
            <span className="num text-sm font-medium text-ink">{gridYear}</span>
            <IconButton
              variant="ghost"
              size={6}
              onClick={() => setGridYear((year) => year + 1)}
              aria-label={text.nextYear}
            >
              <ChevronRight />
            </IconButton>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, index) => {
              const cellDate = new Date(gridYear, index, 1);
              const isSelected = month != null && month.getFullYear() === gridYear && month.getMonth() === index;
              const isCurrent = currentMonthStart.getFullYear() === gridYear && currentMonthStart.getMonth() === index;
              return (
                <button
                  key={format(cellDate, "MM")}
                  type="button"
                  onClick={() => selectMonth(cellDate)}
                  aria-current={isSelected ? "date" : undefined}
                  aria-label={text.goToMonth(format(cellDate, "MMMM yyyy", { locale: fr }))}
                  className={cn(
                    "cursor-pointer rounded-sm py-1.5 text-sm capitalize tracking-normal transition-colors",
                    isSelected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-ink-2 hover:bg-surface-hi hover:text-ink",
                    !isSelected && isCurrent && "text-elec ring-1 ring-inset ring-elec/40",
                  )}
                >
                  {format(cellDate, "MMM", { locale: fr })}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthPickerPopover;
