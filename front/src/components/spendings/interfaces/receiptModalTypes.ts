/** Header of the receipt modal for a group or a shared receipt (PFA-189). */
export interface ReceiptModalHeader {
  title: string;
  tag: string;
  /** Colours of the tag chip — blue for a shared receipt, neutral for a group. */
  tagClassName: string;
  /** The group's total, or the sum of the spendings sharing the receipt. */
  amount: number;
}
