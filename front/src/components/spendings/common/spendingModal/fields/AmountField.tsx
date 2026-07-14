import { Label } from "@components/ui/label";

import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface AmountFieldProps {
  register: UseFormRegister<SpendingForm>;
  errors: FieldErrors<SpendingForm>;
}

const AmountField = ({ register, errors }: AmountFieldProps) => (
  <div className="flex flex-col gap-2">
    <Label
      htmlFor="spendingAmount"
      className="text-sm text-ink-2"
    >
      Montant
    </Label>
    <div className="flex items-baseline gap-2 rounded-md border border-line bg-background px-3 py-2.5 transition-colors focus-within:border-accent-d">
      <input
        id="spendingAmount"
        inputMode="decimal"
        placeholder="0,00"
        className="num min-w-0 flex-1 bg-transparent text-sm font-medium tracking-tight text-ink outline-none placeholder:text-ink-5"
        {...register("spendingAmount")}
      />
      <span className="num text-sm text-ink-3">€</span>
    </div>
    {errors.spendingAmount && <p className="text-xs text-neg">{errors.spendingAmount.message}</p>}
  </div>
);

export default AmountField;
