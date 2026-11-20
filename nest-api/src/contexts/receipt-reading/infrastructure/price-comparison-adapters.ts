import type {
  ReceiptLine,
  StoreIdentity,
  TypedLines,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ProductTypeCatalog } from "@contexts/receipt-reading/domain/ports/product-type-catalog";
import { StoreDirectory } from "@contexts/receipt-reading/domain/ports/store-directory";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";
import type { LinkedLine } from "@spendings/product-types/interfaces/productTypesTypes";
import { linkProductTypes, storeKey } from "@spendings/product-types/product-links";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
import { StoresService } from "@spendings/stores/stores.service";
import { textKey } from "@spendings/text-key";

// How far back the auto-link learns from: plenty for a household's receipts.
const LINK_HISTORY = 2000;

/**
 * The shops, through price comparison's own service (PFA-274): an anti-corruption layer, so the
 * receipt context depends on its port and not on how stores are kept.
 */
@Injectable()
export class StoresServiceDirectory extends StoreDirectory {
  constructor(private readonly stores: StoresService) {
    super();
  }

  recognise(read: StoreIdentity | null, ownerId: string): Promise<StoreIdentity | null> {
    return this.stores.recognise(read, ownerId);
  }

  resolve(store: StoreIdentity, ownerId: string): Promise<string | null> {
    return this.stores.resolve(store, ownerId);
  }
}

/** The product types, through price comparison's own service and the lines typed before. */
@Injectable()
export class ProductTypesServiceCatalog extends ProductTypeCatalog {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypes: ProductTypesService,
  ) {
    super();
  }

  async idsFor(lines: ReceiptLine[], ownerId: string): Promise<(string | null)[]> {
    const typeIds = await this.productTypes.resolve(
      lines.flatMap((line) => (line.productType ? [line.productType] : [])),
      ownerId,
    );
    return lines.map((line) => (line.productType ? (typeIds.get(textKey(line.productType)) ?? null) : null));
  }

  async link(typed: TypedLines, store: StoreIdentity | null): Promise<ReceiptLine[]> {
    if (typed.lines.length === 0) return typed.lines;
    const rows = await this.prisma.receiptLines.findMany({
      where: { productTypeID: { not: null }, spending: { userID: typed.ownerId } },
      orderBy: [{ spending: { date: "desc" } }, { position: "asc" }],
      take: LINK_HISTORY,
      select: {
        label: true,
        productType: { select: { name: true } },
        spending: { select: { store: { select: { name: true, address: true } } } },
      },
    });
    const history: LinkedLine[] = rows.flatMap((row) =>
      row.productType
        ? [
            {
              label: row.label,
              productType: row.productType.name,
              storeKey: row.spending.store ? storeKey(row.spending.store) : null,
            },
          ]
        : [],
    );
    return linkProductTypes(typed.lines, history, store);
  }
}
