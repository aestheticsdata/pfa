import type { ReceiptHolder } from "@spendings/receipt-proposals/interfaces/receiptProposalsTypes";

/**
 * The receipts a bulk read takes (PFA-223): a spending's own receipt only. A
 * file held by several rows is a shared receipt or a group's (PFA-189), which
 * the single read leaves alone too. `holders` counts the rows per file.
 */
export function ownReceipts(spendings: ReceiptHolder[], holders: Map<string, number>): string[] {
  return spendings.filter((spending) => (holders.get(spending.invoicefile) ?? 0) <= 1).map((spending) => spending.ID);
}
