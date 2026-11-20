import type { InvoiceHolder } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/**
 * Which rows hold which receipt (PFA-274). Nothing records a share besides rows pointing at the
 * same `invoicefile`: a receipt replaced on one spending is replaced on every spending holding it.
 */
export abstract class ReceiptHolders {
  /** The receipts of the owner's spendings among `ids`; null when one of them is not the owner's. */
  abstract receiptsOf(spendingIds: string[], ownerId: string): Promise<(string | null)[] | null>;
  abstract attach(spendingIds: string[], ownerId: string, file: string | null): Promise<void>;
  abstract fileOf(holder: InvoiceHolder): Promise<string | null>;
  /** Gives the holder a new file — every row sharing its old one with it — and returns the old one. */
  abstract replace(holder: InvoiceHolder, file: string): Promise<string | null>;
  /** Takes the file off the holder — every spending sharing it, for a spending. */
  abstract clear(holder: InvoiceHolder, file: string): Promise<void>;
}
