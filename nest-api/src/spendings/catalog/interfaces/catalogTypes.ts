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
