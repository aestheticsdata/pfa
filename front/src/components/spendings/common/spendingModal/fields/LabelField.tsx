import { TextInput } from "@components/shared/TextInput";
import { Label } from "@components/ui/label";
import spendings from "@text/spendings";

import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { LabelSuggestion } from "@src/schemas/spendings";
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
    <Label
      htmlFor="spendingLabel"
      className="text-sm text-ink-2"
    >
      {spendings.modal.fields.label}
    </Label>
    <TextInput
      id="spendingLabel"
      placeholder={spendings.modal.fields.labelPlaceholder}
      className="dark:bg-surface-base"
      {...register("spendingLabel", {
        onChange: (e) => setLabelQuery(e.target.value),
      })}
    />
    {errors.spendingLabel && <p className="text-xs text-neg">{errors.spendingLabel.message}</p>}
    {/* Suggestions are spending-specific, hidden for recurrings. */}
    {!asRecurring && labelSuggestions.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {labelSuggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applySuggestion(s)}
            className="rounded-md border border-line bg-surface-hi px-2 py-1 text-2xs text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
          >
            {s.label}
            {s.category && <span className="text-ink-4"> — {s.category}</span>}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default LabelField;
