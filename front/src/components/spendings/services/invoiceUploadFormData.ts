import { itemTypeSchema } from "@src/schemas/primitives";

import type { InvoiceUploadTarget } from "@components/spendings/interfaces/invoiceUploadTypes";
import type { ShareReceiptInput } from "@components/spendings/interfaces/spendingGroupTypes";

export const buildInvoiceUploadFormData = (target: InvoiceUploadTarget, file: File): FormData => {
  const formData = new FormData();

  switch (target.itemType) {
    case itemTypeSchema.enum.recurring:
      formData.append("itemType", itemTypeSchema.enum.recurring);
      if (target.dateFrom) {
        formData.append("dateFrom", target.dateFrom);
      }
      break;
    case itemTypeSchema.enum.spending:
      formData.append("itemType", itemTypeSchema.enum.spending);
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
  formData.append("itemType", itemTypeSchema.enum.spending);
  formData.append("date", date);
  formData.append("label", label);
  formData.append("invoiceImageUpload", file);
  return formData;
};
