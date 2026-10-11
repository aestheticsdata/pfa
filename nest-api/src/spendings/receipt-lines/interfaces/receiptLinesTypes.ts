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

/** A slip's horizontal extent in the receipt photo, in pixels: [start, end). */
export interface SlipBounds {
  start: number;
  end: number;
}

/** A single-channel image as raw bytes, one per pixel, row after row. */
export interface GrayImage {
  data: Buffer;
  width: number;
  height: number;
}
