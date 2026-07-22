import { TextInput } from "@components/shared/TextInput";
import { Label } from "@components/ui/label";
import useTranslations from "@i18n/useTranslations";

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

// Shared by the real chips and the invisible placeholder, so an empty row keeps
// the exact same height as a filled one (COS-159).
const CHIP_CLASSNAME =
  "min-w-0 shrink truncate rounded-md border border-line bg-surface-hi px-2 py-1 text-2xs text-ink-2";

const LabelField = ({
  register,
  errors,
  asRecurring,
  labelSuggestions,
  applySuggestion,
  setLabelQuery,
}: LabelFieldProps) => {
  const spendings = useTranslations("spendings");
  // Suggestions are spending-specific, hidden for recurrings.
  const suggestions = asRecurring ? [] : labelSuggestions;

  return (
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
      {/* Always mounted: an error appearing must not push the rest of the modal down. */}
      <p className="min-h-4 text-xs text-neg">{errors.spendingLabel?.message}</p>
      {/*
        Suggestion row: always mounted and always one line high (no wrap, chips
        truncate), so the dialog keeps a constant height while typing — the list
        shrinks and grows on every keystroke (COS-159).
      */}
      <div className="flex gap-1.5">
        {suggestions.length > 0 ? (
          suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => applySuggestion(s)}
              className={`${CHIP_CLASSNAME} cursor-pointer transition-colors hover:border-ink-4 hover:text-ink`}
            >
              {s.label}
              {s.category && <span className="text-ink-4"> — {s.category}</span>}
            </button>
          ))
        ) : (
          <span
            aria-hidden
            className={`${CHIP_CLASSNAME} invisible`}
          >
            &nbsp;
          </span>
        )}
      </div>
    </div>
  );
};

export default LabelField;
