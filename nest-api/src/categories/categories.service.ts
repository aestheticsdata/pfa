import type { CategoryItem } from "@categories/interfaces/categoryTypes";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Listed, never the whole row: a new column stays out of the response until asked for (PFA-257). */
const CATEGORY_ITEM_SELECT = { ID: true, userID: true, name: true, color: true } as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userID: string): Promise<CategoryItem[]> {
    return this.prisma.categories.findMany({
      where: { userID },
      select: CATEGORY_ITEM_SELECT,
    });
  }

  async updateCategory(id: string, userID: string, dto: { name: string; color: string }): Promise<CategoryItem[]> {
    const updated = await this.prisma.categories.updateMany({
      where: { ID: id, userID },
      data: { name: dto.name, color: dto.color },
    });

    if (updated.count === 0) {
      throw new NotFoundException("Category not found");
    }

    return this.prisma.categories.findMany({
      where: { userID },
      select: CATEGORY_ITEM_SELECT,
    });
  }

  async deleteCategory(id: string, userID: string): Promise<{ success: boolean }> {
    const category = await this.prisma.categories.findFirst({
      where: { ID: id, userID },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({
        where: { categoryID: id },
        data: { categoryID: null },
      }),
      this.prisma.recurrings.updateMany({
        where: { categoryID: id },
        data: { categoryID: null },
      }),
      this.prisma.categories.delete({
        where: { ID: id },
      }),
    ]);

    return { success: true };
  }
}
