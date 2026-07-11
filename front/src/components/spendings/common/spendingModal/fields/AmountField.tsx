import type { SpendingForm } from "@components/spendings/common/spendingModal/schema";
import { Label } from "@components/ui/label";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface AmountFieldProps {
  register: UseFormRegister<SpendingForm>;
  errors: FieldErrors<SpendingForm>;
}

const AmountField = ({ register, errors }: AmountFieldProps) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor="spendingAmount" className="text-[13px] text-ink-2">
      Montant
    </Label>
    <div className="flex items-baseline gap-2 rounded-md border border-line bg-background px-4 py-3 transition-colors focus-within:border-accent-d">
      <input
        id="spendingAmount"
        inputMode="decimal"
        placeholder="0,00"
        className="num min-w-0 flex-1 bg-transparent text-[28px] font-medium tracking-[-0.02em] text-ink outline-none placeholder:text-ink-5"
        {...register("spendingAmount")}
      />
      <span className="num text-[18px] text-ink-3">€</span>
    </div>
    {errors.spendingAmount && <p className="text-xs text-neg">{errors.spendingAmount.message}</p>}
  </div>
);

export default AmountField;
