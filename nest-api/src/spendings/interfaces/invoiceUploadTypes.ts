/** A receipt image multer just wrote to disk, and the row it belongs to. */
export interface InvoiceUpload {
  filepath: string;
  filename: string;
  spendingID: string;
  itemType: string;
}
