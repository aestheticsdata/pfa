import type { StoreIdentity } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/** A shop of the user, as listed for the store field. */
export interface StoreRef extends StoreIdentity {
  ID: string;
}
