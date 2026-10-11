/** A store as read on a receipt or confirmed by the user: name and address (PFA-218, PFA-219). */
export interface StoreIdentity {
  name: string;
  address: string | null;
}

/** A shop of the user, as listed for the store field. */
export interface StoreRef extends StoreIdentity {
  ID: string;
}
