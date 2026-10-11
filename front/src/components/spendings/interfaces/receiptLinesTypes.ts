import type { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";

export type ReceiptLinesMode = (typeof RECEIPT_LINES_MODE)[keyof typeof RECEIPT_LINES_MODE];

/** The spending whose receipt lines the modal shows (PFA-214). */
export interface ReceiptLinesTarget {
  spendingID: string;
  label: string;
  amount: number;
  mode: ReceiptLinesMode;
}

/** A receipt line as the editor holds it: the amount is the text being typed. */
export interface ReceiptLineDraft {
  key: string;
  label: string;
  amount: string;
}

export interface ReceiptLinesState {
  target: ReceiptLinesTarget | null;
  open: (target: ReceiptLinesTarget) => void;
  setMode: (mode: ReceiptLinesMode) => void;
  close: () => void;
}
