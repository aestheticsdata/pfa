import type { ReceiptProposal } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

/** The bulk read's progress for a user (PFA-223). */
export interface BulkReadStatus {
  /** Receipts not read yet: own receipt, no lines, never queued. */
  candidates: number;
  queued: number;
  ready: number;
  failed: number;
}

/** A read receipt waiting for the user's review, with its spending. */
export interface PendingProposal {
  spendingID: string;
  label: string;
  amount: number;
  date: string;
  proposal: ReceiptProposal;
}

/** A spending with a receipt, as the candidate filter sees it. */
export interface ReceiptHolder {
  ID: string;
  invoicefile: string;
}
