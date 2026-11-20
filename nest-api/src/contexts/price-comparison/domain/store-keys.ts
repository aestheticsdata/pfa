import { FIELD_LIMITS } from "@config/field-limits";
import { CatalogName } from "@contexts/price-comparison/domain/catalog-name";
import type { StoreKeys } from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import type { StoreIdentity } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/**
 * A store is a name **and** an address (PFA-219): two shops of one chain are priced apart. The
 * pair of keys is what makes a store one store for its owner.
 */
export function storeKeys(store: StoreIdentity): StoreKeys {
  const name = CatalogName.of(store.name, FIELD_LIMITS.storeName);
  const address = CatalogName.of(store.address ?? "", FIELD_LIMITS.storeAddress);
  return { name: name.text, address: address.text || null, nameKey: name.key, addressKey: address.key };
}
