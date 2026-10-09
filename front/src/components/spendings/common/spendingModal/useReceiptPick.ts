import { useState } from "react";

/**
 * A receipt image picked in a modal before upload: the file and a data-URL
 * preview. Shared by the spending modal and the grouping / shared-receipt
 * modals (PFA-189).
 */
const useReceiptPick = () => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const onReceiptFile = (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setReceiptPreview(typeof e.target?.result === "string" ? e.target.result : null);
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  return { receiptFile, receiptPreview, onReceiptFile, clearReceipt };
};

export default useReceiptPick;
