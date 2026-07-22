import { FieldShell } from "@components/shared/FieldShell";
import useTranslations from "@i18n/useTranslations";

import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface AmountFieldProps {
  register: UseFormRegister<SpendingForm>;
  errors: FieldErrors<SpendingForm>;
}

const AmountField = ({ register, errors }: AmountFieldProps) => {
  const spendings = useTranslations("spendings");

  return (
    <FieldShell
      label={spendings.modal.fields.amount}
      htmlFor="spendingAmount"
      error={errors.spendingAmount?.message}
    >
      <div className="flex items-baseline gap-2 rounded-md border border-line bg-surface-base px-3 py-2.5 transition-colors focus-within:border-accent-d">
        <input
          id="spendingAmount"
          inputMode="decimal"
          placeholder="0,00"
          className="num min-w-0 flex-1 bg-transparent text-sm font-medium tracking-tight text-ink outline-none placeholder:text-ink-5"
          {...register("spendingAmount")}
        />
        <span className="num text-sm text-ink-3">€</span>
      </div>
    </FieldShell>
  );
};

export default AmountField;
