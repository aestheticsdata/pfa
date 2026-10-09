import type { ShareReceiptInput } from "@components/spendings/interfaces/spendingGroupTypes";

// Multipart body of POST /spendings/upload — shared by the row's InvoiceModal
// and the receipt-at-creation chain (PFA-5).
export interface InvoiceUploadTarget {
  ID: string;
  itemType: string;
  label: string;
  userID: string;
  date?: string | null;
  dateFrom?: string | null;
}

export const buildInvoiceUploadFormData = (target: InvoiceUploadTarget, file: File): FormData => {
  const formData = new FormData();
  formData.append("userID", target.userID);

  switch (target.itemType) {
    case "recurring":
      formData.append("itemType", "recurring");
      if (target.dateFrom) {
        formData.append("dateFrom", target.dateFrom);
      }
      break;
    case "spending":
      formData.append("itemType", "spending");
      if (target.date) {
        formData.append("date", target.date);
      }
      break;
    default:
      break;
  }

  formData.append("label", target.label);
  formData.append("spendingID", target.ID);
  // The file must stay the last part: multer streams parts in order and derives
  // the stored filename from itemType/date/label, which must already be parsed
  // when the file part arrives.
  formData.append("invoiceImageUpload", file);
  return formData;
};

// Multipart body of POST /spendings/receipts (PFA-189): one file for several
// spendings. Same ordering rule as above — the naming fields, then the file.
export const buildSharedReceiptFormData = ({ spendingIDs, file, label, date }: ShareReceiptInput): FormData => {
  const formData = new FormData();
  formData.append("spendingIDs", JSON.stringify(spendingIDs));
  formData.append("itemType", "spending");
  formData.append("date", date);
  formData.append("label", label);
  formData.append("invoiceImageUpload", file);
  return formData;
};
