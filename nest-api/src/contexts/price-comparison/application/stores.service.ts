import { markDuplicates, sameStore } from "@contexts/price-comparison/domain/catalog-duplicates";
import {
  EmptyStoreName,
  StoreExists,
  StoreInUse,
  StoreNotFound,
  StoreSelfMerge,
} from "@contexts/price-comparison/domain/catalog-errors";
import type {
  OwnedEntry,
  StoreEntry,
  StoreRef,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { StoreRepository } from "@contexts/price-comparison/domain/ports/store.repository";
import { storeKeys } from "@contexts/price-comparison/domain/store-keys";
import { recogniseStore } from "@contexts/price-comparison/domain/store-name";
import type { StoreIdentity } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { Injectable } from "@nestjs/common";

/** The user's stores (PFA-218): one row per shop — name and address (PFA-219). */
@Injectable()
export class StoresService {
  constructor(private readonly stores: StoreRepository) {}

  list(ownerId: string): Promise<StoreRef[]> {
    return this.stores.list(ownerId);
  }

  /** A store read on a receipt, as the user's known shop when it is one. */
  async recognise(read: StoreIdentity | null, ownerId: string): Promise<StoreIdentity | null> {
    if (!read) return null;
    const known = recogniseStore(read, await this.stores.list(ownerId));
    return known ? { name: known.name, address: known.address } : read;
  }

  /** The store's ID for a name and address the user confirmed, created on first use. */
  async resolve(store: StoreIdentity, ownerId: string): Promise<string | null> {
    const keys = storeKeys(store);
    return keys.nameKey ? this.stores.upsert(keys, ownerId) : null;
  }

  /** The stores with their purchase counts and likely duplicates (PFA-224). */
  async usage(ownerId: string): Promise<StoreEntry[]> {
    const entries = (await this.stores.usage(ownerId)).map((store) => ({ ...store, duplicateOf: null }));
    return markDuplicates(entries, sameStore);
  }

  /** A new name or address; refused when another store already bears both — merge it instead. */
  async rename(store: OwnedEntry, identity: StoreIdentity): Promise<StoreRef> {
    await this.assertOwned(store);
    const keys = storeKeys(identity);
    if (!keys.nameKey) throw new EmptyStoreName();
    const twin = await this.stores.twin(keys, store);
    if (twin) throw new StoreExists(twin);
    return this.stores.rename(store.id, keys);
  }

  async merge(sourceId: string, targetId: string, ownerId: string): Promise<void> {
    if (sourceId === targetId) throw new StoreSelfMerge();
    await Promise.all([this.assertOwned({ id: sourceId, ownerId }), this.assertOwned({ id: targetId, ownerId })]);
    await this.stores.merge({ sourceId, targetId, ownerId });
  }

  /** Only a store no spending was bought at. */
  async remove(store: OwnedEntry): Promise<void> {
    await this.assertOwned(store);
    if (await this.stores.purchases(store.id)) throw new StoreInUse();
    await this.stores.remove(store.id);
  }

  private async assertOwned(store: OwnedEntry): Promise<void> {
    if (!(await this.stores.exists(store))) throw new StoreNotFound();
  }
}
