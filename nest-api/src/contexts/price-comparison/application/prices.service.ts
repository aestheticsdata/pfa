import { ProductTypeNotFound } from "@contexts/price-comparison/domain/catalog-errors";
import type {
  OwnedEntry,
  PriceComparison,
  ProductTypeSummary,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { PriceReadModel } from "@contexts/price-comparison/domain/ports/price-read-model";
import { compareStores } from "@contexts/price-comparison/domain/unit-price";
import { Injectable } from "@nestjs/common";

/**
 * What each store charges for a generic product (PFA-220): the user's typed receipt lines bought
 * at a known store, priced per kilo, litre or piece. The ranking is the domain's; the rows are read.
 */
@Injectable()
export class PricesService {
  constructor(private readonly prices: PriceReadModel) {}

  /** The user's product types that have purchases at a known store, most bought first. */
  async summary(ownerId: string): Promise<ProductTypeSummary[]> {
    return (await this.prices.summaries(ownerId))
      .filter((type) => type.purchases > 0)
      .sort((a, b) => b.stores - a.stores || b.purchases - a.purchases || a.name.localeCompare(b.name));
  }

  /** One product type, its stores ranked per basis. */
  async comparison(type: OwnedEntry): Promise<PriceComparison> {
    const found = await this.prices.productType(type);
    if (!found) throw new ProductTypeNotFound();
    return { ...found, comparisons: compareStores(await this.prices.purchases(type)) };
  }
}
