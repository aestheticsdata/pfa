import { Dropzone } from "@components/shared/Dropzone";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { ScanText, Trash2, Upload } from "lucide-react";

import type useInvoiceImage from "@components/spendings/services/useInvoiceImage";

interface InvoiceActionsProps {
  image: ReturnType<typeof useInvoiceImage>;
  /** A spending's own receipt can be read into lines (PFA-214). */
  canReadLines: boolean;
  onReadLines: () => void;
  onAskDelete: () => void;
  deleteLabel?: string;
}

/** Under the photo: upload errors, then progress, read / delete, send / cancel, or the dropzone. */
const InvoiceActions = ({ image, canReadLines, onReadLines, onAskDelete, deleteLabel }: InvoiceActionsProps) => {
  const texts = useTranslations("spendings");
  const { invoiceModal: invoiceModalTexts } = texts;
  const { invoiceImage, pendingPreview, isLoading, isProgress, progressValue, isFileTooBig, isInvalidFile } = image;

  return (
    <div className="flex flex-col gap-2 px-5.5 pb-5.5 pt-4.5">
      {isFileTooBig && <p className="text-center text-sm text-neg">{invoiceModalTexts.fileTooBig}</p>}
      {isInvalidFile && <p className="text-center text-sm text-neg">{invoiceModalTexts.invalidFileType}</p>}

      {isProgress ? (
        <div className="flex flex-col gap-2">
          <span className="num text-right text-xs text-ink-3">{progressValue} %</span>
          <div className="h-2 overflow-hidden rounded bg-surface-hi">
            <div
              className="h-full bg-elec transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      ) : invoiceImage && !isLoading ? (
        <>
          {canReadLines && (
            <Button
              type="button"
              data-testid="receipt-read-lines"
              variant="muted"
              size="lg"
              onClick={onReadLines}
              className="text-base"
            >
              <ScanText />
              {texts.receiptLines.readReceipt}
            </Button>
          )}
          <button
            type="button"
            onClick={onAskDelete}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-danger-solid px-4.5 py-3.5 text-base font-semibold text-on-danger transition-[filter] hover:brightness-110"
          >
            <Trash2 className="size-4" />
            {deleteLabel ?? invoiceModalTexts.delete}
          </button>
        </>
      ) : pendingPreview && !isLoading ? (
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="muted"
            size="lg"
            onClick={image.clearPending}
            className="flex-1 text-base"
          >
            {texts.actions.cancel}
          </Button>
          <Button
            type="button"
            data-testid="receipt-send"
            variant="primary"
            size="lg"
            onClick={image.sendInvoice}
            className="flex-1 text-base"
          >
            {invoiceModalTexts.send}
          </Button>
        </div>
      ) : !isLoading ? (
        <Dropzone
          accept="image/jpeg,image/png,image/webp,image/gif"
          testId="receipt-pick"
          onFile={(file) => {
            if (file) {
              image.selectFile(file);
            }
          }}
          className="flex-col items-center gap-1.5 rounded-xl px-5.5 py-7.5 text-center"
        >
          <Upload className="size-7.5 text-elec" />
          <span className="text-base font-semibold text-ink">{invoiceModalTexts.chooseFile}</span>
          <span className="num text-sm text-ink-4">{invoiceModalTexts.fileTypeWarning}</span>
        </Dropzone>
      ) : null}
    </div>
  );
};

export default InvoiceActions;
