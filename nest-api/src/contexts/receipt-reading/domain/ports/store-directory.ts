import type { StoreIdentity } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/** The user's shops, as receipt reading needs them (PFA-274). Price comparison owns them. */
export abstract class StoreDirectory {
  /** A store read slightly off comes back as the user's known shop. */
  abstract recognise(read: StoreIdentity | null, ownerId: string): Promise<StoreIdentity | null>;
  /** The store's ID, created when the user has no shop of that name at that address. */
  abstract resolve(store: StoreIdentity, ownerId: string): Promise<string | null>;
}
