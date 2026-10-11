import { IconButton } from "@components/shared/IconButton";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { X } from "lucide-react";

import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";

interface ReceiptLineRowProps {
  draft: ReceiptLineDraft;
  isInvalid: boolean;
  onChange: (key: string, patch: Partial<ReceiptLineDraft>) => void;
  onRemove: (key: string) => void;
}

const FIELD =
  "h-9.5 min-w-0 rounded-md border bg-surface-base px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-5 focus:border-accent-d";

/** label · amount · remove — one editable receipt line (PFA-214). */
const ReceiptLineRow = ({ draft, isInvalid, onChange, onRemove }: ReceiptLineRowProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const missingLabel = isInvalid && !draft.label.trim();

  return (
    <div
      data-testid="receipt-line"
      className="grid grid-cols-[minmax(0,1fr)_7.5rem_1.875rem] items-center gap-2"
    >
      <input
        data-testid="receipt-line-label"
        aria-label={t.labelAria}
        aria-invalid={missingLabel}
        value={draft.label}
        maxLength={FIELD_LIMITS.receiptLineLabel}
        placeholder={t.labelPlaceholder}
        onChange={(e) => onChange(draft.key, { label: e.target.value })}
        className={cn(FIELD, missingLabel ? "border-neg" : "border-line")}
      />
      <span
        className={cn(
          "flex h-9.5 min-w-0 items-baseline gap-1.5 rounded-md border bg-surface-base px-3 py-2.25 transition-colors focus-within:border-accent-d",
          isInvalid && !missingLabel ? "border-neg" : "border-line",
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
  );
};

export default ReceiptLineRow;
