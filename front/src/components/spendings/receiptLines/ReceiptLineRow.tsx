import { IconButton } from "@components/shared/IconButton";
import ProductTypePicker from "@components/spendings/receiptLines/ProductTypePicker";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { sizeUnitSchema } from "@src/schemas/receiptLines";
import { Sparkles, X } from "lucide-react";

import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";

interface ReceiptLineRowProps {
  draft: ReceiptLineDraft;
  isInvalid: boolean;
  onChange: (key: string, patch: Partial<ReceiptLineDraft>) => void;
  onRemove: (key: string) => void;
}

const FIELD =
  "h-9.5 min-w-0 rounded-md border bg-surface-base px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-5 focus:border-accent-d";
const NUMBER_FIELD = cn(FIELD, "num text-right");

/**
 * One editable receipt line: label · amount · remove, then its generic product,
 * count and size — what a price per kg / L / piece needs (PFA-214, PFA-219).
 */
const ReceiptLineRow = ({ draft, isInvalid, onChange, onRemove }: ReceiptLineRowProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const missingLabel = isInvalid && !draft.label.trim();
  const border = (bad: boolean) => (isInvalid && bad ? "border-neg" : "border-line");

  return (
    <div
      data-testid="receipt-line"
      className="flex flex-col gap-1.5 border-t border-line-soft pt-2.5 first:border-t-0 first:pt-0"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_1.875rem] items-center gap-2">
        <input
          data-testid="receipt-line-label"
          aria-label={t.labelAria}
          aria-invalid={missingLabel}
          value={draft.label}
          maxLength={FIELD_LIMITS.receiptLineLabel}
          placeholder={t.labelPlaceholder}
          onChange={(e) => onChange(draft.key, { label: e.target.value })}
          className={cn(FIELD, border(missingLabel))}
        />
        <span
          className={cn(
            "flex h-9.5 min-w-0 items-baseline gap-1.5 rounded-md border bg-surface-base px-3 py-2.25 transition-colors focus-within:border-accent-d",
            border(!missingLabel),
          )}
        >
          <input
            data-testid="receipt-line-amount"
            aria-label={t.amountAria}
            aria-invalid={isInvalid}
            inputMode="decimal"
            placeholder="0,00"
            value={draft.amount}
            onChange={(e) => onChange(draft.key, { amount: e.target.value })}
            className="num min-w-0 flex-1 bg-transparent text-right text-sm text-ink outline-none placeholder:text-ink-5"
          />
          <span className="num text-sm text-ink-3">€</span>
        </span>
        <IconButton
          variant="danger"
          size={7}
          title={t.removeLine}
          aria-label={t.removeLine}
          onClick={() => onRemove(draft.key)}
          className="size-7.5"
        >
          <X />
        </IconButton>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_3.75rem_4.5rem_4.5rem_1.875rem] items-center gap-2 max-md:grid-cols-[minmax(0,1fr)_3.75rem_4.5rem_4.5rem]">
        <ProductTypePicker
          value={draft.productType}
          onChange={(productType) => onChange(draft.key, { productType })}
        />
        <input
          data-testid="receipt-line-quantity"
          aria-label={t.quantityAria}
          title={t.quantityAria}
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => onChange(draft.key, { quantity: e.target.value })}
          className={cn(NUMBER_FIELD, border(true))}
        />
        <input
          data-testid="receipt-line-size"
          aria-label={t.sizeAria}
          title={t.sizeAria}
          inputMode="decimal"
          placeholder="—"
          value={draft.size}
          onChange={(e) => onChange(draft.key, { size: e.target.value })}
          className={cn(NUMBER_FIELD, border(true))}
        />
        <select
          data-testid="receipt-line-size-unit"
          aria-label={t.sizeUnitAria}
          value={draft.sizeUnit ?? ""}
          onChange={(e) => {
            const unit = sizeUnitSchema.safeParse(e.target.value);
            onChange(draft.key, unit.success ? { sizeUnit: unit.data } : { sizeUnit: null, size: "" });
          }}
          className={cn(FIELD, "cursor-pointer px-2", border(true))}
        >
          <option value="">{t.noSize}</option>
          {sizeUnitSchema.options.map((unit) => (
            <option
              key={unit}
              value={unit}
            >
              {t.sizeUnits[unit]}
            </option>
          ))}
        </select>
        {draft.linked ? (
          <span
            className="grid size-7.5 place-items-center text-accent-strong max-md:hidden"
            role="img"
            aria-label={t.linkedTitle}
            title={t.linkedTitle}
          >
            <Sparkles className="size-4" />
          </span>
        ) : (
          <span className="max-md:hidden" />
        )}
      </div>
    </div>
  );
};

export default ReceiptLineRow;
