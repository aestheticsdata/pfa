import { randomUUID } from "node:crypto";
import type {
  CategoryEdit,
  CategoryItem,
  OwnedRecord,
  TypedCategory,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { CategoryRepository } from "@contexts/budget-planning/domain/ports/category.repository";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

/** Listed, never the whole row: a new column stays out of the response until asked for (PFA-257). */
const CATEGORY_ITEM_SELECT = { ID: true, userID: true, name: true, color: true } as const;

@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  list(ownerId: string): Promise<CategoryItem[]> {
    return this.prisma.categories.findMany({ where: { userID: ownerId }, select: CATEGORY_ITEM_SELECT });
  }

  async isUsable(category: OwnedRecord): Promise<boolean> {
    const row = await this.prisma.categories.findFirst({
      where: { ID: category.id, OR: [{ userID: category.ownerId }, { userID: null }] },
      select: { ID: true },
    });
    return row !== null;
  }

  async ownedBy(category: OwnedRecord): Promise<boolean> {
    const row = await this.prisma.categories.findFirst({
      where: { ID: category.id, userID: category.ownerId },
      select: { ID: true },
    });
    return row !== null;
  }

  async findByName(name: string, ownerId: string): Promise<string | null> {
    return (
      (await this.prisma.categories.findFirst({ where: { userID: ownerId, name }, select: { ID: true } }))?.ID ?? null
    );
  }

  async create(category: TypedCategory, ownerId: string): Promise<string> {
    const ID = randomUUID();
    await this.prisma.categories.create({ data: { ID, userID: ownerId, name: category.name, color: category.color } });
    return ID;
  }

  async edit(category: OwnedRecord, edit: CategoryEdit): Promise<boolean> {
    const updated = await this.prisma.categories.updateMany({
      where: { ID: category.id, userID: category.ownerId },
      data: { name: edit.name, color: edit.color },
    });
    return updated.count > 0;
  }

  async removeDetaching(categoryId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({ where: { categoryID: categoryId }, data: { categoryID: null } }),
      this.prisma.recurrings.updateMany({ where: { categoryID: categoryId }, data: { categoryID: null } }),
      this.prisma.categories.delete({ where: { ID: categoryId } }),
    ]);
  }
}
