import { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import ReceiptLinesDetail from "@components/spendings/receiptLines/ReceiptLinesDetail";
import ReceiptLinesEditor from "@components/spendings/receiptLines/ReceiptLinesEditor";
import ReceiptLinesStatus from "@components/spendings/receiptLines/ReceiptLinesStatus";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import useTranslations from "@i18n/useTranslations";

import type { ReceiptLinesTarget } from "@components/spendings/interfaces/receiptLinesTypes";
import type useReceiptLines from "@components/spendings/services/useReceiptLines";
import type { SavedReceipt } from "@src/schemas/receiptLines";

interface ReceiptLinesBodyProps {
  target: ReceiptLinesTarget;
  receiptLines: ReturnType<typeof useReceiptLines>;
  onDismiss: () => void;
}

/** What the modal shows for its mode: the OCR proposal, the saved lines, or their editor (PFA-214). */
const ReceiptLinesBody = ({ target, receiptLines, onDismiss }: ReceiptLinesBodyProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const setMode = useReceiptLinesStore((state) => state.setMode);
  const { saved, proposal, save } = receiptLines;
  const isReview = target.mode === RECEIPT_LINES_MODE.review;

  const editor = (initial: SavedReceipt, receiptTotal: number | null) => (
    <ReceiptLinesEditor
      initial={initial}
      spendingAmount={target.amount}
      receiptTotal={receiptTotal}
      isSaving={save.isPending}
      onSave={(receipt) => save.mutate(receipt, { onSuccess: () => setMode(RECEIPT_LINES_MODE.detail) })}
      onCancel={isReview ? onDismiss : () => setMode(RECEIPT_LINES_MODE.detail)}
    />
  );

  if (isReview) {
    if (proposal.isPending) return <ReceiptLinesStatus message={t.reading} />;
    if (proposal.isError) {
      return (
        <ReceiptLinesStatus
          isError
          onRetry={() => proposal.refetch()}
        />
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {proposal.data.lines.length === 0 && <p className="text-sm text-ink-3">{t.nothingFound}</p>}
        {editor({ lines: proposal.data.lines, store: proposal.data.store }, proposal.data.total)}
      </div>
    );
  }

  if (saved.isPending) return <ReceiptLinesStatus />;
  if (saved.isError) return <ReceiptLinesStatus isError />;
  if (target.mode === RECEIPT_LINES_MODE.edit) return editor(saved.data, null);

  return (
    <ReceiptLinesDetail
      lines={saved.data.lines}
      store={saved.data.store}
      spendingAmount={target.amount}
      onReread={() => setMode(RECEIPT_LINES_MODE.review)}
      onEdit={() => setMode(RECEIPT_LINES_MODE.edit)}
    />
  );
};

export default ReceiptLinesBody;
