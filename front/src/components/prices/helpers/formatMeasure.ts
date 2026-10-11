import type { PurchaseMeasure } from "@components/prices/interfaces/pricesTypes";
import type { SizeUnit } from "@src/schemas/receiptLines";

/** Decimal numbers as written in French: "0,5", "1,5". */
const asText = (value: number) => String(value).replace(".", ",");

/**
 * What a purchase was, as shown next to its price (PFA-220): "4 × 1 L",
 * "250 g", "× 3", or nothing for a single item without size.
 */
const formatMeasure = (measure: PurchaseMeasure, units: Record<SizeUnit, string>) => {
  const size = measure.size !== null && measure.sizeUnit ? `${asText(measure.size)} ${units[measure.sizeUnit]}` : "";
  if (measure.quantity === 1) return size;
  return size ? `${asText(measure.quantity)} × ${size}` : `× ${asText(measure.quantity)}`;
};

export default formatMeasure;
