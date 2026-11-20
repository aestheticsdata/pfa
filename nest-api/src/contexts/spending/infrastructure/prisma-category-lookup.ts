import { randomUUID } from "node:crypto";
import type { TypedCategory } from "@contexts/spending/domain/interfaces/spendingTypes";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

/** The categories as the Spending context needs them (PFA-273), until budget planning owns them. */
@Injectable()
export class PrismaCategoryLookup extends CategoryLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isUsable(categoryId: string, ownerId: string): Promise<boolean> {
    const category = await this.prisma.categories.findFirst({
      where: { ID: categoryId, OR: [{ userID: ownerId }, { userID: null }] },
      select: { ID: true },
    });
    return category !== null;
  }

  async findOrCreate(category: TypedCategory, ownerId: string): Promise<string> {
    const existing = await this.prisma.categories.findFirst({ where: { userID: ownerId, name: category.name } });
    if (existing) return existing.ID;
    const ID = randomUUID();
    await this.prisma.categories.create({ data: { ID, userID: ownerId, name: category.name, color: category.color } });
    return ID;
  }
}
