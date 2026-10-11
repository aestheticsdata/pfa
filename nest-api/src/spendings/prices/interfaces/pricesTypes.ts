import type { PRICE_BASIS } from "@spendings/prices/price-basis";
import type { SizeUnit } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

export type PriceBasis = (typeof PRICE_BASIS)[keyof typeof PRICE_BASIS];

/** One saved receipt line of a product type, at a known store (PFA-220). */
export interface Purchase {
  storeID: string;
  storeName: string;
  storeAddress: string | null;
  /** The spending's day, yyyy-MM-dd. */
  date: string;
  amount: number;
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
}

/** A price per kilo, per litre, or per piece. */
export interface UnitPrice {
  price: number;
  basis: PriceBasis;
}

/** One store's prices for a product type, on one basis. */
export interface StorePrice {
  storeID: string;
  name: string;
  address: string | null;
  lastUnitPrice: number;
  averageUnitPrice: number;
  /** The last line as paid: its amount, count and size. */
  lastAmount: number;
  lastQuantity: number;
  lastSize: number | null;
  lastSizeUnit: SizeUnit | null;
  lastDate: string;
  purchases: number;
  cheapest: boolean;
  /** Unit price over time, oldest first. */
  history: { date: string; unitPrice: number }[];
}

/** The stores ranked on one basis, cheapest first — kilos and pieces never mixed. */
export interface BasisComparison {
  basis: PriceBasis;
  stores: StorePrice[];
}

/** A product type in the list: how many stores and purchases it has. */
export interface ProductTypeSummary {
  ID: string;
  name: string;
  stores: number;
  purchases: number;
}

/** One product type's comparison: its stores ranked on each basis it was bought on. */
export interface PriceComparison {
  ID: string;
  name: string;
  comparisons: BasisComparison[];
}
