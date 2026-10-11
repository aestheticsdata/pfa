import { keyDistance, textKey } from "@spendings/text-key";
import type { StoreIdentity, StoreRef } from "@spendings/stores/interfaces/storesTypes";

/**
 * The known store a receipt stands for (PFA-219). A store is a name and an
 * address — two shops of one chain are priced apart — so the name alone only
 * decides when the receipt shows no address and a single store bears it.
 */
export function recogniseStore(read: StoreIdentity, stores: StoreRef[]): StoreRef | null {
  const nameKey = textKey(read.name);
  const sameName = stores.filter((store) => keyDistance(nameKey, textKey(store.name)) !== null);
  if (!read.address) return sameName.length === 1 ? sameName[0] : null;

  const addressKey = textKey(read.address);
  let best: { store: StoreRef; distance: number } | null = null;
  for (const store of sameName) {
    const distance = keyDistance(addressKey, textKey(store.address ?? ""));
    if (distance !== null && (!best || distance < best.distance)) best = { store, distance };
  }
  return best?.store ?? null;
}
