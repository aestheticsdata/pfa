import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import { DATE_FORMAT } from "@components/spendings/config/constants";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { cn } from "@lib/utils";
import addDays from "date-fns/addDays";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UseFormGetValues, UseFormRegister, UseFormSetValue } from "react-hook-form";

interface DateFieldProps {
  register: UseFormRegister<SpendingForm>;
  getValues: UseFormGetValues<SpendingForm>;
  setValue: UseFormSetValue<SpendingForm>;
  asRecurring: boolean;
}

const DateField = ({ register, getValues, setValue, asRecurring }: DateFieldProps) => {
  const stepDate = (delta: number) => {
    const current = getValues("spendingDate");
    const base = current ? parseISO(current) : new Date();
    setValue("spendingDate", format(addDays(base, delta), DATE_FORMAT), {
      shouldValidate: true,
    });
  };

  return (
    // Date is not applicable to a recurring (no single charge date), so
    // it is disabled — not removed or swapped for a month stepper — when
    // "Récurrente mensuelle" is on.
    <div className="flex flex-col gap-2">
      <Label htmlFor="spendingDate" className="text-[13px] text-ink-2">
        Date
      </Label>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-md border border-line bg-background transition-opacity",
          asRecurring ? "opacity-45" : "focus-within:border-accent-d",
        )}
      >
        <button
          type="button"
          aria-label="Jour précédent"
          onClick={() => stepDate(-1)}
          disabled={asRecurring}
          className="grid place-items-center border-r border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-3"
        >
          <ChevronLeft className="size-4" />
        </button>
        <Input
          id="spendingDate"
          type="date"
          disabled={asRecurring}
          className="num flex-1 rounded-none border-0 bg-transparent text-sm text-ink [color-scheme:dark] focus-visible:ring-0 disabled:cursor-not-allowed"
          {...register("spendingDate")}
        />
        <button
          type="button"
          aria-label="Jour suivant"
          onClick={() => stepDate(1)}
          disabled={asRecurring}
          className="grid place-items-center border-l border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-3"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default DateField;
