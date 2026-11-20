import type { PRICE_BASIS } from "@contexts/price-comparison/domain/price-basis";
import type { SizeUnit, StoreIdentity } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

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
  /** Unit price over time, oldest first (PFA-222). */
  history: PricePoint[];
}

/** One purchase on a store's price history: its unit price, and the line as paid. */
export interface PricePoint {
  date: string;
  unitPrice: number;
  amount: number;
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
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
/** A store or a product type as the management panel lists it (PFA-224). */
export interface CatalogEntry {
  ID: string;
  name: string;
  /** Spendings bought at the store, or receipt lines of the type. */
  uses: number;
  /** The entry this one is likely a duplicate of, to merge into; null when none. */
  duplicateOf: string | null;
}

/** A store as the management panel lists it: its address too. */
export interface StoreEntry extends CatalogEntry {
  address: string | null;
}

/** Whether two entries likely stand for the same store or product. */
export type SameEntry<T extends CatalogEntry> = (a: T, b: T) => boolean;

/** A shop of the user, as listed for the store field. */
export interface StoreRef extends StoreIdentity {
  ID: string;
}
/** A generic product of the user, as listed for the type field (PFA-219). */
export interface ProductTypeRef {
  ID: string;
  name: string;
}

/** A line saved before, as the auto-link learns from it: its label, its type, its store. */
export interface LinkedLine {
  label: string;
  productType: string;
  /** `storeKey` of the store it was bought at, null when none was recorded. */
  storeKey: string | null;
}

/** A store's name and address as kept, and the keys it is recognised by (PFA-219). */
export interface StoreKeys {
  name: string;
  address: string | null;
  nameKey: string;
  addressKey: string;
}

/** A store or a product type, and whose it is. */
export interface OwnedEntry {
  id: string;
  ownerId: string;
}

/** Folding one entry into another: what pointed at the source points at the target. */
export interface CatalogMerge {
  sourceId: string;
  targetId: string;
  ownerId: string;
}

/** A store or a product type before its likely duplicate is marked. */
export type CatalogUsage = Omit<CatalogEntry, "duplicateOf">;
export type StoreUsage = Omit<StoreEntry, "duplicateOf">;
