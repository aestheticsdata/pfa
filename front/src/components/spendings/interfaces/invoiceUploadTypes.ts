// Multipart body of POST /spendings/upload — shared by the row's InvoiceModal
// and the receipt-at-creation chain (PFA-5).
export interface InvoiceUploadTarget {
  ID: string;
  itemType: string;
  label: string;
  date?: string | null;
  dateFrom?: string | null;
}
