import type {
  OwnedEntry,
  ProductTypeRef,
  ProductTypeSummary,
  Purchase,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { PriceReadModel } from "@contexts/price-comparison/domain/ports/price-read-model";
import type { SizeUnit } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { SIZE_UNIT } from "@contexts/receipt-reading/domain/size-units";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";
import { format } from "date-fns";

const SIZE_UNITS = new Set<string>(Object.values(SIZE_UNIT));
const isSizeUnit = (unit: string | null): unit is SizeUnit => unit !== null && SIZE_UNITS.has(unit);

@Injectable()
export class PrismaPriceReadModel extends PriceReadModel {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async summaries(ownerId: string): Promise<ProductTypeSummary[]> {
    const types = await this.prisma.productTypes.findMany({
      where: { userID: ownerId },
      select: {
        ID: true,
        name: true,
        receiptLines: {
          where: { spending: { storeID: { not: null } } },
          select: { spending: { select: { storeID: true } } },
        },
      },
    });
    return types.map((type) => ({
      ID: type.ID,
      name: type.name,
      stores: new Set(type.receiptLines.map((line) => line.spending.storeID)).size,
      purchases: type.receiptLines.length,
    }));
  }

  productType(type: OwnedEntry): Promise<ProductTypeRef | null> {
    return this.prisma.productTypes.findFirst({
      where: { ID: type.id, userID: type.ownerId },
      select: { ID: true, name: true },
    });
  }

  async purchases(type: OwnedEntry): Promise<Purchase[]> {
    const lines = await this.prisma.receiptLines.findMany({
      where: { productTypeID: type.id, spending: { userID: type.ownerId, storeID: { not: null } } },
      select: {
        amount: true,
        quantity: true,
        size: true,
        sizeUnit: true,
        spending: { select: { date: true, store: { select: { ID: true, name: true, address: true } } } },
      },
    });
    return lines.flatMap(({ spending, ...line }) =>
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
  }
}
