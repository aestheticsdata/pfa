import { humanSize } from "@components/spendings/common/spendingModal/helpers";
import { cn } from "@lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";

interface ReceiptFieldProps {
  receiptFile: File | null;
  receiptPreview: string | null;
  isReceiptDragging: boolean;
  setIsReceiptDragging: Dispatch<SetStateAction<boolean>>;
  onReceiptFile: (file: File | undefined) => void;
  clearReceipt: () => void;
}

const ReceiptField = ({
  receiptFile,
  receiptPreview,
  isReceiptDragging,
  setIsReceiptDragging,
  onReceiptFile,
  clearReceipt,
}: ReceiptFieldProps) => (
  <div className="flex flex-col gap-2">
    {!receiptFile ? (
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setIsReceiptDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsReceiptDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsReceiptDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsReceiptDragging(false);
          onReceiptFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          // children are pointer-events-none so drag events target the
          // label itself (no flicker when hovering child elements)
          "flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-dashed px-4 py-3.5 transition-colors [&_*]:pointer-events-none",
          isReceiptDragging ? "border-elec bg-elec/[0.06]" : "border-line hover:border-elec hover:bg-elec/[0.06]",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-elec/10 text-elec">
          <Upload className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">
            Glisser un reçu ou <span className="text-elec underline underline-offset-2">parcourir</span>
          </span>
          <span className="num text-xs text-ink-4">jpg, png, webp</span>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            onReceiptFile(e.target.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </label>
    ) : (
      <div className="flex items-center gap-3 rounded-md border border-line bg-background p-2 pr-2.5">
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
          <span className="num text-xs text-ink-4">{humanSize(receiptFile.size)}</span>
        </span>
        <button
          type="button"
          onClick={clearReceipt}
          aria-label="Retirer le reçu"
          className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-bg-hi text-ink-3 transition-colors hover:border-[oklch(0.55_0.15_25)] hover:text-neg"
        >
          <X className="size-4" />
        </button>
      </div>
    )}
  </div>
);

export default ReceiptField;
