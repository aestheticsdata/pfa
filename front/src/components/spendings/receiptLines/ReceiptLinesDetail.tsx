import ReceiptLinesList from "@components/spendings/receiptLines/ReceiptLinesList";
import ReceiptLinesSummary from "@components/spendings/receiptLines/ReceiptLinesSummary";
import { sumLines } from "@components/spendings/receiptLines/receiptLineDrafts";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { MapPin, Pencil, ScanText, Store } from "lucide-react";

import type { ReceiptLine, StoreIdentity } from "@src/schemas/receiptLines";

interface ReceiptLinesDetailProps {
  lines: ReceiptLine[];
  store: StoreIdentity | null;
  spendingAmount: number;
  onReread: () => void;
  onEdit: () => void;
}

/** The saved store and lines, with their sum against the spending, to edit or read again (PFA-214, PFA-218). */
const ReceiptLinesDetail = ({ lines, store, spendingAmount, onReread, onEdit }: ReceiptLinesDetailProps) => {
  const { receiptLines: t } = useTranslations("spendings");

  return (
    <div className="flex flex-col gap-3">
      {store && (
        <div
          data-testid="receipt-lines-store"
          className="flex flex-col gap-1 text-sm"
        >
          <p className="flex items-center gap-2">
            <Store className="size-4 shrink-0 text-ink-4" />
            <span className="truncate font-medium text-ink">{store.name}</span>
          </p>
          {store.address && (
            <p className="flex items-center gap-2 text-ink-3">
              <MapPin className="size-4 shrink-0 text-ink-4" />
              <span className="truncate">{store.address}</span>
            </p>
          )}
        </div>
      )}
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
