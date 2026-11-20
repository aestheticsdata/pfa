import type {
  OwnedEntry,
  ProductTypeRef,
  ProductTypeSummary,
  Purchase,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";

/** What the price screens read (PFA-275): the read side, shaped for them. */
export abstract class PriceReadModel {
  /** The user's product types with purchases at a known store, unsorted. */
  abstract summaries(ownerId: string): Promise<ProductTypeSummary[]>;
  abstract productType(type: OwnedEntry): Promise<ProductTypeRef | null>;
  /** The type's receipt lines bought at a known store. */
  abstract purchases(type: OwnedEntry): Promise<Purchase[]>;
}
