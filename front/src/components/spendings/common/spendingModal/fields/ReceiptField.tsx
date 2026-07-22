import { Dropzone } from "@components/shared/Dropzone";
import { IconButton } from "@components/shared/IconButton";
import { humanSize } from "@components/spendings/common/spendingModal/helpers";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ReceiptFieldProps {
  receiptFile: File | null;
  receiptPreview: string | null;
  onReceiptFile: (file: File | undefined) => void;
  clearReceipt: () => void;
}

const ReceiptField = ({ receiptFile, receiptPreview, onReceiptFile, clearReceipt }: ReceiptFieldProps) => {
  const spendings = useTranslations("spendings");
  const { numberLocale } = useFormat();

  return (
    <div className="flex flex-col gap-2">
      {!receiptFile ? (
        <Dropzone
          accept="image/jpeg,image/png,image/webp,image/gif"
          onFile={onReceiptFile}
          className="items-center gap-3 rounded-md px-4 py-3.5"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-elec/10 text-elec">
            <Upload className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">
              {spendings.modal.receipt.dropPrompt}{" "}
              <span className="text-elec underline underline-offset-2">{spendings.modal.receipt.browse}</span>
            </span>
            <span className="num text-xs text-ink-4">{spendings.modal.receipt.fileTypes}</span>
          </span>
        </Dropzone>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface-base p-2 pr-2.5">
          {receiptPreview && (
            <Image
              src={receiptPreview}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-md object-cover"
              unoptimized
            />
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-ink">{receiptFile.name}</span>
            <span className="num text-xs text-ink-4">
              {humanSize(receiptFile.size, spendings.modal.fileSize, numberLocale)}
            </span>
          </span>
          <IconButton
            variant="danger"
            size={8}
            onClick={clearReceipt}
            aria-label={spendings.modal.receipt.removeAria}
          >
            <X />
          </IconButton>
        </div>
      )}
    </div>
  );
};

export default ReceiptField;
