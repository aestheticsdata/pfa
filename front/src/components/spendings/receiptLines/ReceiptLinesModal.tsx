"use client";

import { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import ReceiptLinesBody from "@components/spendings/receiptLines/ReceiptLinesBody";
import ReceiptThumb from "@components/spendings/receiptLines/ReceiptThumb";
import useReceiptLines from "@components/spendings/services/useReceiptLines";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { useState } from "react";

import type { ReceiptLinesTarget } from "@components/spendings/interfaces/receiptLinesTypes";

interface ReceiptLinesModalProps {
  target: ReceiptLinesTarget;
}

const CLOSE_ANIMATION_MS = 200;

/**
 * A spending's receipt lines (PFA-214). Review: the OCR reads the receipt and
 * proposes lines to correct. Detail: the saved lines. Edit: the saved lines,
 * editable. The receipt sits beside them throughout.
 */
const ReceiptLinesModal = ({ target }: ReceiptLinesModalProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const close = useReceiptLinesStore((state) => state.close);
  const [open, setOpen] = useState(true);
  const isReview = target.mode === RECEIPT_LINES_MODE.review;
  const receiptLines = useReceiptLines(target.spendingID, { withSaved: !isReview, withProposal: isReview });
  const lineCount = isReview ? receiptLines.proposal.data?.lines.length : receiptLines.saved.data?.length;

  const dismiss = () => {
    setOpen(false);
    setTimeout(close, CLOSE_ANIMATION_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && dismiss()}
    >
      <DialogContent
        data-testid="receipt-lines-modal"
        className="max-h-[92vh] gap-0 overflow-y-auto border-line bg-surface-elev p-0 sm:max-w-[860px]"
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0 pb-4 pl-5.5 pr-14 pt-5 text-left">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-xl font-semibold tracking-tight text-ink">
              {isReview ? t.reviewTitle : t.detailTitle}
            </DialogTitle>
            <DialogDescription className="truncate text-sm text-ink-3">
              {target.label}
              {lineCount != null && ` · ${t.linesCount(lineCount)}`}
            </DialogDescription>
          </div>
          <span className="num shrink-0 whitespace-nowrap text-lg font-semibold tracking-tight text-elec">
            {euro(target.amount)} €
          </span>
        </DialogHeader>

        <div className="grid gap-4 px-5.5 pb-5.5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start">
          <ReceiptThumb spendingID={target.spendingID} />
          <div className="min-w-0">
            <ReceiptLinesBody
              target={target}
              receiptLines={receiptLines}
              onDismiss={dismiss}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptLinesModal;
