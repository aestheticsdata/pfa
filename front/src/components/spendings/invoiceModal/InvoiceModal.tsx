"use client";

import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import InvoiceActions from "@components/spendings/invoiceModal/InvoiceActions";
import InvoiceModalHeader from "@components/spendings/invoiceModal/InvoiceModalHeader";
import InvoiceStage from "@components/spendings/invoiceModal/InvoiceStage";
import InvoiceImageModal from "@components/spendings/invoiceModal/invoiceImageModal/InvoiceImageModal";
import useInvoiceImage from "@components/spendings/services/useInvoiceImage";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import { Dialog, DialogContent } from "@components/ui/dialog";
import useTranslations from "@i18n/useTranslations";
import { itemTypeSchema } from "@src/schemas/primitives";
import { useState } from "react";

import type { InvoiceSpending, ReceiptModalHeader } from "@components/spendings/interfaces/receiptModalTypes";
import type { ReactNode } from "react";

interface InvoiceModalProps {
  handleClickOutside: () => void;
  spending: InvoiceSpending;
  /** Replaces the label / category / amount of the header — a group or a shared receipt (PFA-189). */
  header?: ReceiptModalHeader;
  /** When the receipt covers several spendings, an upload goes to all of them (PFA-189). */
  uploadSpendingIDs?: string[];
  deleteLabel?: string;
  /** Shown under the header: the group's lines or the spendings sharing the receipt. */
  children?: ReactNode;
}

const InvoiceModal = ({
  handleClickOutside: handleClickOutsideProp,
  spending,
  header,
  uploadSpendingIDs,
  deleteLabel,
  children,
}: InvoiceModalProps) => {
  const { invoiceModal: invoiceModalTexts } = useTranslations("spendings");
  const [open, setOpen] = useState(true);
  const handleClickOutside = () => {
    setOpen(false);
    setTimeout(handleClickOutsideProp, 200);
  };
  const image = useInvoiceImage({ spending, uploadSpendingIDs, sharedLabel: header?.title });
  const [isClickOnThumbnail, setIsClickOnThumbnail] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const openReceiptLines = useReceiptLinesStore((state) => state.open);
  // A spending's own receipt can be read into lines (PFA-214); a shared one,
  // a group's or an exceptional's cannot.
  const canReadLines = spending.itemType === itemTypeSchema.enum.spending && !image.isSharedUpload;

  const readLines = () => {
    openReceiptLines({
      spendingID: spending.ID,
      label: spending.label,
      amount: spending.amount,
      mode: RECEIPT_LINES_MODE.review,
    });
    handleClickOutside();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isOpen && handleClickOutside()}
      >
        <DialogContent
          data-testid="receipt-modal"
          className="max-h-[92vh] gap-0 overflow-y-auto border-line bg-surface-elev p-0 sm:max-w-[600px]"
        >
          <InvoiceModalHeader
            spending={spending}
            header={header}
          />

          {children}

          <InvoiceStage
            isLoading={image.isLoading}
            isProgress={image.isProgress}
            invoiceImage={image.invoiceImage}
            pendingPreview={image.pendingPreview}
            onEnlarge={() => setIsClickOnThumbnail(true)}
          />

          <InvoiceActions
            image={image}
            canReadLines={canReadLines}
            onReadLines={readLines}
            onAskDelete={() => setShowConfirmDeleteImage(true)}
            deleteLabel={deleteLabel}
          />
        </DialogContent>
      </Dialog>

      {isClickOnThumbnail && image.invoiceImage && (
        <InvoiceImageModal
          image={image.invoiceImage}
          closeImage={() => setIsClickOnThumbnail(false)}
        />
      )}

      <ConfirmDeleteDialog
        open={showConfirmDeleteImage}
        onOpenChange={setShowConfirmDeleteImage}
        title={invoiceModalTexts.deleteConfirmTitle}
        onConfirm={image.deleteImage}
      />
    </>
  );
};

export default InvoiceModal;
