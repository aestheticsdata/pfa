import type { SizeUnit } from "@src/schemas/receiptLines";

/** How much was bought: count and size of one item (PFA-220). */
export interface PurchaseMeasure {
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
}
