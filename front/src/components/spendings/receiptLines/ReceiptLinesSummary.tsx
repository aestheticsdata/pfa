import { linesMatch } from "@components/spendings/receiptLines/receiptLineDrafts";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { TriangleAlert } from "lucide-react";

interface ReceiptLinesSummaryProps {
  sum: number;
  spendingAmount: number;
  /** The total the OCR read on the receipt, when it found one. */
  receiptTotal?: number | null;
}

const FIGURE = "flex items-baseline justify-between gap-3 text-sm";

/** Sum of the lines against the spending: a gap is shown, never blocking (PFA-214). */
const ReceiptLinesSummary = ({ sum, spendingAmount, receiptTotal }: ReceiptLinesSummaryProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const matches = linesMatch(sum, spendingAmount);

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-line bg-surface-base px-3 py-2.5">
      <div className={FIGURE}>
        <span className="text-ink-3">{t.sum}</span>
        <span
          data-testid="receipt-lines-sum"
          className={cn("num font-semibold", matches ? "text-accent-strong" : "text-ink")}
        >
          {euro(sum)} €
        </span>
      </div>
      <div className={FIGURE}>
        <span className="text-ink-4">{t.spendingAmount}</span>
        <span className="num text-ink-3">{euro(spendingAmount)} €</span>
      </div>
      {receiptTotal != null && (
        <div className={FIGURE}>
          <span className="text-ink-4">{t.receiptTotal}</span>
          <span className="num text-ink-3">{euro(receiptTotal)} €</span>
        </div>
      )}
      {!matches && (
        <p
          data-testid="receipt-lines-mismatch"
          className="mt-1 flex items-center gap-1.5 text-xs text-warn"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          {t.mismatch(euro(Math.abs(sum - spendingAmount)))}
        </p>
      )}
    </div>
  );
};

export default ReceiptLinesSummary;
