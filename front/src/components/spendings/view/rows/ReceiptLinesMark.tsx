import useTranslations from "@i18n/useTranslations";
import { ReceiptText } from "lucide-react";

interface ReceiptLinesMarkProps {
  lineCount: number;
  onOpen: () => void;
}

/**
 * Next to a row's label: its receipt was read into lines (PFA-214). The row
 * opens them on click; the mark is the keyboard path to the same detail.
 */
const ReceiptLinesMark = ({ lineCount, onOpen }: ReceiptLinesMarkProps) => {
  const { receiptLines: t } = useTranslations("spendings");

  return (
    <button
      type="button"
      data-testid="receipt-lines-mark"
      onClick={onOpen}
      aria-label={t.markTitle(lineCount)}
      title={t.markTitle(lineCount)}
      className="inline-flex shrink-0 cursor-pointer items-center rounded-sm text-accent-strong outline-none focus-visible:ring-2 focus-visible:ring-elec/60"
    >
      <ReceiptText className="size-3.5" />
    </button>
  );
};

export default ReceiptLinesMark;
