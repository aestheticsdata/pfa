import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ImageIcon } from "lucide-react";

interface ReceiptMarkProps {
  /** Rows sharing the receipt, 0 when it is this row's own (PFA-189). */
  shareCount: number;
}

/** The receipt indicator next to a row's label; a shared one reads "×N" in blue. */
const ReceiptMark = ({ shareCount }: ReceiptMarkProps) => {
  const { txRow, groups } = useTranslations("spendings");
  const isShared = shareCount > 0;

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-0.5", isShared ? "text-elec" : "text-ink-4")}
      role="img"
      aria-label={isShared ? groups.sharedReceiptTitle(shareCount) : txRow.receiptAttachedAria}
      title={isShared ? groups.sharedReceiptTitle(shareCount) : undefined}
    >
      <ImageIcon className="size-3.5" />
      {isShared && <span className="num text-2xs font-semibold">×{shareCount}</span>}
    </span>
  );
};

export default ReceiptMark;
