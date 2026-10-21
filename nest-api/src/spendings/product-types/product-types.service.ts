import { randomUUID } from "node:crypto";
import { FIELD_LIMITS } from "@config/field-limits";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { markDuplicates, sameProductType } from "@spendings/catalog/catalog-duplicates";
import type { CatalogEntry } from "@spendings/catalog/interfaces/catalogTypes";
import type { ProductTypeRef } from "@spendings/product-types/interfaces/productTypesTypes";
import { textKey } from "@spendings/text-key";
import { PrismaService } from "../../prisma/prisma.service";

/** The user's generic products (PFA-219): one row per name, whatever its spelling. */
@Injectable()
export class ProductTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userID: string): Promise<ProductTypeRef[]> {
    return this.prisma.productTypes.findMany({
      where: { userID },
      select: { ID: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  /** The ID of each named type, by its key, created on first use. */
  async resolve(names: string[], userID: string): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    for (const raw of names) {
      const name = raw.trim().slice(0, FIELD_LIMITS.productTypeName);
      const nameKey = textKey(name);
      if (!nameKey || ids.has(nameKey)) continue;
      const saved = await this.prisma.productTypes.upsert({
        where: { userID_nameKey: { userID, nameKey } },
        create: { ID: randomUUID(), userID, name, nameKey },
        update: {},
        select: { ID: true },
      });
      ids.set(nameKey, saved.ID);
    }
    return ids;
  }

  /** The types with their purchase counts and likely duplicates (PFA-224). */
  async usage(userID: string): Promise<CatalogEntry[]> {
    const types = await this.prisma.productTypes.findMany({
      where: { userID },
      select: { ID: true, name: true, _count: { select: { receiptLines: true } } },
      orderBy: { name: "asc" },
    });
    const entries = types.map(({ _count, ...type }) => ({ ...type, uses: _count.receiptLines, duplicateOf: null }));
    return markDuplicates(entries, sameProductType);
  }

  /** A new name; refused when another type already bears it — merge it instead. */
  async rename(typeID: string, rawName: string, userID: string): Promise<ProductTypeRef> {
    await this.owned(typeID, userID);
    const name = rawName.trim().slice(0, FIELD_LIMITS.productTypeName);
    const nameKey = textKey(name);
    if (!nameKey) throw new BadRequestException("Product type name is empty");
    const twin = await this.prisma.productTypes.findFirst({
      where: { userID, nameKey, ID: { not: typeID } },
      select: { ID: true },
    });
    if (twin) throw new ConflictException({ message: "Product type already exists", conflictID: twin.ID });
    return this.prisma.productTypes.update({
      where: { ID: typeID },
      data: { name, nameKey },
      select: { ID: true, name: true },
    });
  }

  /** The source's receipt lines move to the target, then the source goes, all at once. */
  async merge(sourceID: string, targetID: string, userID: string): Promise<void> {
    if (sourceID === targetID) throw new BadRequestException("A product type cannot merge into itself");
    await Promise.all([this.owned(sourceID, userID), this.owned(targetID, userID)]);
    await this.prisma.$transaction([
      this.prisma.receiptLines.updateMany({ where: { productTypeID: sourceID }, data: { productTypeID: targetID } }),
      this.prisma.productTypes.delete({ where: { ID: sourceID } }),
    ]);
  }

  /** Only a type no receipt line has. */
  async remove(typeID: string, userID: string): Promise<void> {
    await this.owned(typeID, userID);
    if (await this.prisma.receiptLines.count({ where: { productTypeID: typeID } })) {
      throw new ConflictException("Product type is in use");
    }
    await this.prisma.productTypes.delete({ where: { ID: typeID } });
  }

  private async owned(typeID: string, userID: string): Promise<void> {
    const type = await this.prisma.productTypes.findFirst({ where: { ID: typeID, userID }, select: { ID: true } });
    if (!type) throw new NotFoundException("Product type not found");
  }
}
