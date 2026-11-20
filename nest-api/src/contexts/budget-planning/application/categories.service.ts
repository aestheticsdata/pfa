import { CategoryNotFound, CategoryNotUsable } from "@contexts/budget-planning/domain/budget-errors";
import { CATEGORY_CHOICE } from "@contexts/budget-planning/domain/category-choice";
import type {
  CategoryChoice,
  CategoryEdit,
  CategoryItem,
  OwnedRecord,
  TypedCategory,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { CategoryRepository } from "@contexts/budget-planning/domain/ports/category.repository";
import { Injectable } from "@nestjs/common";

/**
 * The categories (PFA-276). Never created on their own: a category is typed in a spending's or a
 * recurring's modal and comes into being there (PFA-38).
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoryRepository) {}

  list(ownerId: string): Promise<CategoryItem[]> {
    return this.categories.list(ownerId);
  }

  isUsable(category: OwnedRecord): Promise<boolean> {
    return this.categories.isUsable(category);
  }

  /** The user's category of that name, created when there is none. */
  async findOrCreate(category: TypedCategory, ownerId: string): Promise<string> {
    return (await this.categories.findByName(category.name, ownerId)) ?? this.categories.create(category, ownerId);
  }

  /** The category ID a choice comes to: checked, kept, or created. */
  async resolve(choice: CategoryChoice, ownerId: string): Promise<string | null> {
    switch (choice.kind) {
      case CATEGORY_CHOICE.unchanged:
        return choice.categoryId;
      case CATEGORY_CHOICE.existing:
        if (!(await this.isUsable({ id: choice.categoryId, ownerId }))) throw new CategoryNotUsable();
        return choice.categoryId;
      case CATEGORY_CHOICE.typed:
        return this.findOrCreate(choice.category, ownerId);
      case CATEGORY_CHOICE.none:
        return null;
    }
  }

  async edit(category: OwnedRecord, edit: CategoryEdit): Promise<CategoryItem[]> {
    if (!(await this.categories.edit(category, edit))) throw new CategoryNotFound();
    return this.categories.list(category.ownerId);
  }

  async remove(category: OwnedRecord): Promise<{ success: boolean }> {
    if (!(await this.categories.ownedBy(category))) throw new CategoryNotFound();
    await this.categories.removeDetaching(category.id);
    return { success: true };
  }
}
