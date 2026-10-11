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
