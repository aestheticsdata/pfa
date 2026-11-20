import { FIELD_LIMITS } from "@config/field-limits";
import { markDuplicates, sameProductType } from "@contexts/price-comparison/domain/catalog-duplicates";
import {
  EmptyProductTypeName,
  ProductTypeExists,
  ProductTypeInUse,
  ProductTypeNotFound,
  ProductTypeSelfMerge,
} from "@contexts/price-comparison/domain/catalog-errors";
import { CatalogName } from "@contexts/price-comparison/domain/catalog-name";
import type {
  CatalogEntry,
  OwnedEntry,
  ProductTypeRef,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { ProductTypeRepository } from "@contexts/price-comparison/domain/ports/product-type.repository";
import { Injectable } from "@nestjs/common";

const typeName = (raw: string) => CatalogName.of(raw, FIELD_LIMITS.productTypeName);

/** The user's generic products (PFA-219): one row per name, whatever its spelling. */
@Injectable()
export class ProductTypesService {
  constructor(private readonly types: ProductTypeRepository) {}

  list(ownerId: string): Promise<ProductTypeRef[]> {
    return this.types.list(ownerId);
  }

  /** The ID of each named type, by its key, created on first use. */
  async resolve(names: string[], ownerId: string): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    for (const raw of names) {
      const name = typeName(raw);
      if (name.isBlank() || ids.has(name.key)) continue;
      ids.set(name.key, await this.types.upsert(name, ownerId));
    }
    return ids;
  }

  /** The types with their purchase counts and likely duplicates (PFA-224). */
  async usage(ownerId: string): Promise<CatalogEntry[]> {
    const entries = (await this.types.usage(ownerId)).map((type) => ({ ...type, duplicateOf: null }));
    return markDuplicates(entries, sameProductType);
  }

  /** A new name; refused when another type already bears it — merge it instead. */
  async rename(type: OwnedEntry, rawName: string): Promise<ProductTypeRef> {
    await this.assertOwned(type);
    const name = typeName(rawName);
    if (name.isBlank()) throw new EmptyProductTypeName();
    const twin = await this.types.twin(name, type);
    if (twin) throw new ProductTypeExists(twin);
    return this.types.rename(type.id, name);
  }

  async merge(sourceId: string, targetId: string, ownerId: string): Promise<void> {
    if (sourceId === targetId) throw new ProductTypeSelfMerge();
    await Promise.all([this.assertOwned({ id: sourceId, ownerId }), this.assertOwned({ id: targetId, ownerId })]);
    await this.types.merge({ sourceId, targetId, ownerId });
  }

  /** Only a type no receipt line has. */
  async remove(type: OwnedEntry): Promise<void> {
    await this.assertOwned(type);
    if (await this.types.lineCount(type.id)) throw new ProductTypeInUse();
    await this.types.remove(type.id);
  }

  private async assertOwned(type: OwnedEntry): Promise<void> {
    if (!(await this.types.exists(type))) throw new ProductTypeNotFound();
  }
}
