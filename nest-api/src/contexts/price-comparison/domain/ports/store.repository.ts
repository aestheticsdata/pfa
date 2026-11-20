import type {
  CatalogMerge,
  OwnedEntry,
  StoreKeys,
  StoreRef,
  StoreUsage,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";

/** The user's stores (PFA-275): one per name key and address key. */
export abstract class StoreRepository {
  abstract list(ownerId: string): Promise<StoreRef[]>;
  /** Each store with how many spendings were bought there. */
  abstract usage(ownerId: string): Promise<StoreUsage[]>;
  abstract exists(store: OwnedEntry): Promise<boolean>;
  /** Another store of the owner bearing these keys, if any. */
  abstract twin(keys: StoreKeys, store: OwnedEntry): Promise<string | null>;
  /** The store bearing these keys, created on first use. */
  abstract upsert(keys: StoreKeys, ownerId: string): Promise<string>;
  abstract rename(storeId: string, keys: StoreKeys): Promise<StoreRef>;
  /** The source's spendings move to the target, then the source goes, all at once. */
  abstract merge(merge: CatalogMerge): Promise<void>;
  abstract purchases(storeId: string): Promise<number>;
  abstract remove(storeId: string): Promise<void>;
}
