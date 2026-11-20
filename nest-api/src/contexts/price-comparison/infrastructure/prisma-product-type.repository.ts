import { randomUUID } from "node:crypto";
import type { CatalogName } from "@contexts/price-comparison/domain/catalog-name";
import type {
  CatalogMerge,
  CatalogUsage,
  OwnedEntry,
  ProductTypeRef,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { ProductTypeRepository } from "@contexts/price-comparison/domain/ports/product-type.repository";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaProductTypeRepository extends ProductTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  list(ownerId: string): Promise<ProductTypeRef[]> {
    return this.prisma.productTypes.findMany({
      where: { userID: ownerId },
      select: { ID: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async usage(ownerId: string): Promise<CatalogUsage[]> {
    const types = await this.prisma.productTypes.findMany({
      where: { userID: ownerId },
      select: { ID: true, name: true, _count: { select: { receiptLines: true } } },
      orderBy: { name: "asc" },
    });
    return types.map(({ _count, ...type }) => ({ ...type, uses: _count.receiptLines }));
  }

  async exists(type: OwnedEntry): Promise<boolean> {
    const row = await this.prisma.productTypes.findFirst({
      where: { ID: type.id, userID: type.ownerId },
      select: { ID: true },
    });
    return row !== null;
  }

  async twin(name: CatalogName, type: OwnedEntry): Promise<string | null> {
    const row = await this.prisma.productTypes.findFirst({
      where: { userID: type.ownerId, nameKey: name.key, ID: { not: type.id } },
      select: { ID: true },
    });
    return row?.ID ?? null;
  }

  async upsert(name: CatalogName, ownerId: string): Promise<string> {
    const saved = await this.prisma.productTypes.upsert({
      where: { userID_nameKey: { userID: ownerId, nameKey: name.key } },
      create: { ID: randomUUID(), userID: ownerId, name: name.text, nameKey: name.key },
      update: {},
      select: { ID: true },
    });
    return saved.ID;
  }

  rename(typeId: string, name: CatalogName): Promise<ProductTypeRef> {
    return this.prisma.productTypes.update({
      where: { ID: typeId },
      data: { name: name.text, nameKey: name.key },
      select: { ID: true, name: true },
    });
  }

  async merge(merge: CatalogMerge): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.receiptLines.updateMany({
        where: { productTypeID: merge.sourceId },
        data: { productTypeID: merge.targetId },
      }),
      this.prisma.productTypes.delete({ where: { ID: merge.sourceId } }),
    ]);
  }

  lineCount(typeId: string): Promise<number> {
    return this.prisma.receiptLines.count({ where: { productTypeID: typeId } });
  }

  async remove(typeId: string): Promise<void> {
    await this.prisma.productTypes.delete({ where: { ID: typeId } });
  }
}
