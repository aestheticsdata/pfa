import { Injectable, NotFoundException } from "@nestjs/common";
import type { Categories } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userID: string): Promise<Categories[]> {
    return this.prisma.categories.findMany({
      where: { userID },
    });
  }

  async updateCategory(id: string, userID: string, dto: { name: string; color: string }): Promise<Categories[]> {
    const updated = await this.prisma.categories.updateMany({
      where: { ID: id, userID },
      data: { name: dto.name, color: dto.color },
    });

    if (updated.count === 0) {
      throw new NotFoundException("Category not found");
    }

    return this.prisma.categories.findMany({
      where: { userID },
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
      this.prisma.categories.delete({
        where: { ID: id },
      }),
    ]);

    return { success: true };
  }
}
