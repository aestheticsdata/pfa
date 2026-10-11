import type { SIZE_UNIT } from "@spendings/receipt-lines/size-units";
import type { StoreIdentity } from "@spendings/stores/interfaces/storesTypes";

export type SizeUnit = (typeof SIZE_UNIT)[keyof typeof SIZE_UNIT];

/** A product's size: 1 L, 250 g, 0.512 kg for a weighed item (PFA-219). */
export interface ItemSize {
  size: number;
  unit: SizeUnit;
}

/**
 * One line of a receipt: what was bought and what it cost (PFA-214), how many
 * of what size, and the generic product it is (PFA-219).
 */
export interface ReceiptLine {
  label: string;
  amount: number;
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
  productType: string | null;
}

/** What a quantity line under an item says: "3 x 1,10", "0,512 kg x 3,99 €/kg". */
export interface QuantityDetail {
  quantity: number;
  unitPrice: number;
  /** Set for a weighed item: its weight is its size, its quantity one. */
  weight: ItemSize | null;
}

/**
 * A spending's receipt as saved (PFA-218): its lines and its store's name.
 * On a save, an absent store leaves the spending's store as it is.
 */
export interface SavedReceipt {
  lines: ReceiptLine[];
  store?: StoreIdentity | null;
}

/** What the OCR read on a receipt, for the user to check before saving. */
export interface ReceiptProposal {
  lines: ReceiptLine[];
  /** The receipt's own total when one was found, to compare with the lines' sum. */
  total: number | null;
  /** The store read on the receipt, or the user's known shop it is (PFA-218, PFA-219). */
  store: StoreIdentity | null;
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
