import ReceiptLinesList from "@components/spendings/receiptLines/ReceiptLinesList";
import ReceiptLinesSummary from "@components/spendings/receiptLines/ReceiptLinesSummary";
import { sumLines } from "@components/spendings/receiptLines/receiptLineDrafts";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { Pencil, ScanText } from "lucide-react";

import type { ReceiptLine } from "@src/schemas/receiptLines";

interface ReceiptLinesDetailProps {
  lines: ReceiptLine[];
  spendingAmount: number;
  onReread: () => void;
  onEdit: () => void;
}

/** The saved lines, with their sum against the spending, to edit or read again (PFA-214). */
const ReceiptLinesDetail = ({ lines, spendingAmount, onReread, onEdit }: ReceiptLinesDetailProps) => {
  const { receiptLines: t } = useTranslations("spendings");

  return (
    <div className="flex flex-col gap-3">
      <ReceiptLinesList lines={lines} />
      {lines.length > 0 && (
        <ReceiptLinesSummary
          sum={sumLines(lines.map((line) => line.amount))}
          spendingAmount={spendingAmount}
        />
      )}
      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="muted"
          size="lg"
          onClick={onReread}
          className="flex-1 text-base"
        >
          <ScanText />
          {t.retry}
        </Button>
        <Button
          type="button"
          data-testid="receipt-lines-edit"
          variant="primary"
          size="lg"
          onClick={onEdit}
          className="flex-1 text-base"
        >
          <Pencil />
          {t.edit}
        </Button>
      </div>
    </div>
  );
};

export default ReceiptLinesDetail;
