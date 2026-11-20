import type { CatalogName } from "@contexts/price-comparison/domain/catalog-name";
import type {
  CatalogMerge,
  CatalogUsage,
  OwnedEntry,
  ProductTypeRef,
  StoreKeys,
  StoreRef,
  StoreUsage,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { ProductTypeRepository } from "@contexts/price-comparison/domain/ports/product-type.repository";
import { StoreRepository } from "@contexts/price-comparison/domain/ports/store.repository";

interface KeptStore extends StoreKeys {
  ID: string;
  ownerId: string;
  uses: number;
}

/** A driven adapter for unit tests (PFA-275): the user's stores in memory. */
export class InMemoryStoreRepository extends StoreRepository {
  readonly merges: CatalogMerge[] = [];

  constructor(readonly stores: KeptStore[]) {
    super();
  }

  async list(ownerId: string): Promise<StoreRef[]> {
    return this.mine(ownerId).map(({ ID, name, address }) => ({ ID, name, address }));
  }

  async usage(ownerId: string): Promise<StoreUsage[]> {
    return this.mine(ownerId).map(({ ID, name, address, uses }) => ({ ID, name, address, uses }));
  }

  async exists(store: OwnedEntry): Promise<boolean> {
    return this.mine(store.ownerId).some((kept) => kept.ID === store.id);
  }

  async twin(keys: StoreKeys, store: OwnedEntry): Promise<string | null> {
    const twin = this.mine(store.ownerId).find(
      (kept) => kept.ID !== store.id && kept.nameKey === keys.nameKey && kept.addressKey === keys.addressKey,
    );
    return twin?.ID ?? null;
  }

  async upsert(keys: StoreKeys, ownerId: string): Promise<string> {
    return (await this.twin(keys, { id: "", ownerId })) ?? `new:${keys.nameKey}`;
  }

  async rename(storeId: string, keys: StoreKeys): Promise<StoreRef> {
    const store = this.stores.find((kept) => kept.ID === storeId) as KeptStore;
    Object.assign(store, keys);
    return { ID: store.ID, name: store.name, address: store.address };
  }

  async merge(merge: CatalogMerge): Promise<void> {
    this.merges.push(merge);
  }

  async purchases(storeId: string): Promise<number> {
    return this.stores.find((kept) => kept.ID === storeId)?.uses ?? 0;
  }

  async remove(storeId: string): Promise<void> {
    this.stores.splice(
      this.stores.findIndex((kept) => kept.ID === storeId),
      1,
    );
  }

  private mine(ownerId: string): KeptStore[] {
    return this.stores.filter((kept) => kept.ownerId === ownerId);
  }
}

interface KeptType {
  ID: string;
  ownerId: string;
  name: string;
  nameKey: string;
  uses: number;
}

/** A driven adapter for unit tests (PFA-275): the user's product types in memory. */
export class InMemoryProductTypeRepository extends ProductTypeRepository {
  readonly merges: CatalogMerge[] = [];
  readonly created: string[] = [];

  constructor(readonly types: KeptType[]) {
    super();
  }

  async list(ownerId: string): Promise<ProductTypeRef[]> {
    return this.mine(ownerId).map(({ ID, name }) => ({ ID, name }));
  }

  async usage(ownerId: string): Promise<CatalogUsage[]> {
    return this.mine(ownerId).map(({ ID, name, uses }) => ({ ID, name, uses }));
  }

  async exists(type: OwnedEntry): Promise<boolean> {
    return this.mine(type.ownerId).some((kept) => kept.ID === type.id);
  }

  async twin(name: CatalogName, type: OwnedEntry): Promise<string | null> {
    return this.mine(type.ownerId).find((kept) => kept.ID !== type.id && kept.nameKey === name.key)?.ID ?? null;
  }

  async upsert(name: CatalogName, ownerId: string): Promise<string> {
    const existing = await this.twin(name, { id: "", ownerId });
    if (existing) return existing;
    const ID = `new:${name.key}`;
    this.types.push({ ID, ownerId, name: name.text, nameKey: name.key, uses: 0 });
    this.created.push(ID);
    return ID;
  }

  async rename(typeId: string, name: CatalogName): Promise<ProductTypeRef> {
    const type = this.types.find((kept) => kept.ID === typeId) as KeptType;
    Object.assign(type, { name: name.text, nameKey: name.key });
    return { ID: type.ID, name: type.name };
  }

  async merge(merge: CatalogMerge): Promise<void> {
    this.merges.push(merge);
  }

  async lineCount(typeId: string): Promise<number> {
    return this.types.find((kept) => kept.ID === typeId)?.uses ?? 0;
  }

  async remove(typeId: string): Promise<void> {
    this.types.splice(
      this.types.findIndex((kept) => kept.ID === typeId),
      1,
    );
  }

  private mine(ownerId: string): KeptType[] {
    return this.types.filter((kept) => kept.ownerId === ownerId);
  }
}
