import type { CatalogName } from "@contexts/price-comparison/domain/catalog-name";
import type {
  CatalogMerge,
  CatalogUsage,
  OwnedEntry,
  ProductTypeRef,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";

/** The user's generic products (PFA-275): one per name key, whatever the spelling. */
export abstract class ProductTypeRepository {
  abstract list(ownerId: string): Promise<ProductTypeRef[]>;
  /** Each type with how many receipt lines carry it. */
  abstract usage(ownerId: string): Promise<CatalogUsage[]>;
  abstract exists(type: OwnedEntry): Promise<boolean>;
  /** Another type of the owner bearing this key, if any. */
  abstract twin(name: CatalogName, type: OwnedEntry): Promise<string | null>;
  /** The type bearing this name's key, created on first use. */
  abstract upsert(name: CatalogName, ownerId: string): Promise<string>;
  abstract rename(typeId: string, name: CatalogName): Promise<ProductTypeRef>;
  /** The source's receipt lines move to the target, then the source goes, all at once. */
  abstract merge(merge: CatalogMerge): Promise<void>;
  abstract lineCount(typeId: string): Promise<number>;
  abstract remove(typeId: string): Promise<void>;
}
