import type { SizeUnit } from "@src/schemas/receiptLines";

/** How much was bought: count and size of one item (PFA-220). */
export interface PurchaseMeasure {
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
}

/** One purchase as the price history chart draws it (PFA-222). */
export interface HistoryPoint extends PurchaseMeasure {
  storeID: string;
  storeName: string;
  color: string;
  /** Days since the epoch: the chart's x. */
  day: number;
  date: string;
  unitPrice: number;
  amount: number;
}

/** A position on the chart, in pixels. */
export interface PixelPoint {
  x: number;
  y: number;
}
