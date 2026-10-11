import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { FIELD_LIMITS } from "@config/field-limits";
import { textKey } from "@spendings/text-key";
import type { ProductTypeRef } from "@spendings/product-types/interfaces/productTypesTypes";
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
}
