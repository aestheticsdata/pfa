import { Injectable, NotFoundException } from "@nestjs/common";
import type { PriceComparison, ProductTypeSummary, Purchase } from "@spendings/prices/interfaces/pricesTypes";
import { compareStores } from "@spendings/prices/unit-price";
import type { SizeUnit } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import { SIZE_UNIT } from "@spendings/receipt-lines/size-units";
import { format } from "date-fns";
import { PrismaService } from "../../prisma/prisma.service";

const SIZE_UNITS = new Set<string>(Object.values(SIZE_UNIT));
const isSizeUnit = (unit: string | null): unit is SizeUnit => unit !== null && SIZE_UNITS.has(unit);

/**
 * What each store charges for a generic product (PFA-220): the user's typed
 * receipt lines bought at a known store, priced per kilo, litre or piece.
 */
@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's product types that have purchases at a known store, most bought first. */
  async summary(userID: string): Promise<ProductTypeSummary[]> {
    const types = await this.prisma.productTypes.findMany({
      where: { userID },
      select: {
        ID: true,
        name: true,
        receiptLines: {
          where: { spending: { storeID: { not: null } } },
          select: { spending: { select: { storeID: true } } },
        },
      },
    });
    return types
      .map((type) => ({
        ID: type.ID,
        name: type.name,
        stores: new Set(type.receiptLines.map((line) => line.spending.storeID)).size,
        purchases: type.receiptLines.length,
      }))
      .filter((type) => type.purchases > 0)
      .sort((a, b) => b.stores - a.stores || b.purchases - a.purchases || a.name.localeCompare(b.name));
  }

  /** One product type, its stores ranked per basis. */
  async comparison(typeID: string, userID: string): Promise<PriceComparison> {
    const type = await this.prisma.productTypes.findFirst({
      where: { ID: typeID, userID },
      select: { ID: true, name: true },
    });
    if (!type) {
      throw new NotFoundException("Product type not found");
    }
    const lines = await this.prisma.receiptLines.findMany({
      where: { productTypeID: typeID, spending: { userID, storeID: { not: null } } },
      select: {
        amount: true,
        quantity: true,
        size: true,
        sizeUnit: true,
        spending: { select: { date: true, store: { select: { ID: true, name: true, address: true } } } },
      },
    });
    const purchases: Purchase[] = lines.flatMap(({ spending, ...line }) =>
      spending.store
        ? [
            {
              storeID: spending.store.ID,
              storeName: spending.store.name,
              storeAddress: spending.store.address,
              date: format(spending.date, "yyyy-MM-dd"),
              amount: Number(line.amount),
              quantity: Number(line.quantity),
              size: line.size === null ? null : Number(line.size),
              sizeUnit: isSizeUnit(line.sizeUnit) ? line.sizeUnit : null,
            },
          ]
        : [],
    );
    return { ...type, comparisons: compareStores(purchases) };
  }
}
