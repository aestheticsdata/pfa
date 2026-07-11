import type { LabelSuggestion } from "@components/spendings/common/spendingModal/mockSuggestions";
import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import type { Dispatch, SetStateAction } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface LabelFieldProps {
  register: UseFormRegister<SpendingForm>;
  errors: FieldErrors<SpendingForm>;
  asRecurring: boolean;
  labelSuggestions: LabelSuggestion[];
  applySuggestion: (suggestion: LabelSuggestion) => void;
  setLabelQuery: Dispatch<SetStateAction<string>>;
}

const LabelField = ({
  register,
  errors,
  asRecurring,
  labelSuggestions,
  applySuggestion,
  setLabelQuery,
}: LabelFieldProps) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor="spendingLabel" className="text-[13px] text-ink-2">
      Label
    </Label>
    <Input
      id="spendingLabel"
      placeholder="Ex : Boulangerie du coin"
      className="border-line bg-background dark:bg-background text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0"
      {...register("spendingLabel", {
        onChange: (e) => setLabelQuery(e.target.value),
      })}
    />
    {errors.spendingLabel && <p className="text-xs text-neg">{errors.spendingLabel.message}</p>}
    {!asRecurring && labelSuggestions.length > 0 && (
      // MOCK suggestions — spending-specific, hidden for recurrings.
      // (see mockSuggestions.ts) — de-mock tracked in COS-23.
      <div className="flex flex-wrap gap-1.5">
        {labelSuggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applySuggestion(s)}
            className="rounded-md border border-line bg-bg-hi px-2 py-1 text-[11px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
          >
            {s.label}
            <span className="text-ink-4"> — {s.category}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default LabelField;
