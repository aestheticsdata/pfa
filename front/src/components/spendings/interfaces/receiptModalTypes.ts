import type { SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";

/** Header of the receipt modal for a group or a shared receipt (PFA-189). */
export interface ReceiptModalHeader {
  title: string;
  tag: string;
  /** Colours of the tag chip — blue for a shared receipt, neutral for a group. */
  tagClassName: string;
  /** The group's total, or the sum of the spendings sharing the receipt. */
  amount: number;
}

/** The row the receipt modal is opened on: a spending or a recurring, as the lists carry it. */
export type InvoiceSpending = SpendingListItem & {
  category?: string | null;
  categoryColor?: string | null;
  date?: string;
  dateFrom?: string;
};

/** What `useInvoiceImage` works on (PFA-250): the row, and the spendings a shared upload goes to. */
export interface InvoiceImageTarget {
  spending: InvoiceSpending;
  /** When the receipt covers several spendings, an upload goes to all of them (PFA-189). */
  uploadSpendingIDs?: string[];
  /** The shared receipt's name, when it has one (a group or a shared receipt's title). */
  sharedLabel?: string;
}
