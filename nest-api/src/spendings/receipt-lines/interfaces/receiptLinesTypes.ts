/** One line of a receipt: what was bought and what it cost (PFA-214). */
export interface ReceiptLine {
  label: string;
  amount: number;
}

/** What the OCR read on a receipt, for the user to check before saving. */
export interface ReceiptProposal {
  lines: ReceiptLine[];
  /** The receipt's own total when one was found, to compare with the lines' sum. */
  total: number | null;
}
