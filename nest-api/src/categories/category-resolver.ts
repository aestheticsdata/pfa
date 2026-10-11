import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { SpendingCategoryInput } from "@spendings/dto/spending-category-input.interface";
import type { PrismaService } from "../prisma/prisma.service";

export async function assertCategoryAccessible(
  prisma: PrismaService,
  categoryID: string,
  userID: string,
): Promise<void> {
  const category = await prisma.categories.findFirst({
    where: {
      ID: categoryID,
      OR: [{ userID }, { userID: null }],
    },
    select: { ID: true },
  });

  if (!category) {
    throw new BadRequestException("Invalid category ID");
  }
}

/**
 * The category a spending or a recurring points at: an accessible existing one
 * by ID, or one created on the fly from a typed name + colour (reused if the user
 * already has that name). No category → null.
 */
export async function resolveCategoryID(
  prisma: PrismaService,
  category: SpendingCategoryInput | undefined,
  userID: string,
): Promise<string | null> {
  if (category?.ID) {
    await assertCategoryAccessible(prisma, category.ID, userID);
    return category.ID;
  }
  if (category?.ID === null && category?.color != null && category?.name) {
    const existingCategory = await prisma.categories.findFirst({
      where: {
        userID,
        name: category.name,
      },
    });
    if (existingCategory) {
      return existingCategory.ID;
    }
    const newCategoryID = randomUUID();
    await prisma.categories.create({
      data: {
        ID: newCategoryID,
        userID,
        name: category.name,
        color: category.color,
      },
    });
    return newCategoryID;
  }
  return null;
}
