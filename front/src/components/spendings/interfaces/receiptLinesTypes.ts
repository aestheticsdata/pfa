import type { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import type { SizeUnit } from "@src/schemas/receiptLines";

export type ReceiptLinesMode = (typeof RECEIPT_LINES_MODE)[keyof typeof RECEIPT_LINES_MODE];

/** The spending whose receipt lines the modal shows (PFA-214). */
export interface ReceiptLinesTarget {
  spendingID: string;
  label: string;
  amount: number;
  mode: ReceiptLinesMode;
}

/** A receipt line as the editor holds it: numbers are the text being typed. */
export interface ReceiptLineDraft {
  key: string;
  label: string;
  amount: string;
  quantity: string;
  /** Empty when sold by the piece. */
  size: string;
  sizeUnit: SizeUnit | null;
  productType: string | null;
  /** The type came from a label typed before, untouched since (PFA-219). */
  linked: boolean;
}

/** An option of the name comboboxes: a store or a product type. */
export interface NameOption {
  ID: string;
  name: string;
  /** Shown under the name — a store's address. */
  hint: string | null;
}

/** The words of a name combobox. */
export interface NameComboboxText {
  label: string;
  placeholder: string;
  search: string;
  empty: string;
  clear: string;
}

export interface ReceiptLinesState {
  target: ReceiptLinesTarget | null;
  open: (target: ReceiptLinesTarget) => void;
  setMode: (mode: ReceiptLinesMode) => void;
  close: () => void;
}
