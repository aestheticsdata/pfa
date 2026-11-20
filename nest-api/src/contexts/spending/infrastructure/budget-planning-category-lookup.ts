import { CategoriesService } from "@contexts/budget-planning/application/categories.service";
import type { TypedCategory } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { Injectable } from "@nestjs/common";

/**
 * The categories, asked of budget planning, which owns them (PFA-276): the Spending context is its
 * customer and depends on its own port only.
 */
@Injectable()
export class BudgetPlanningCategoryLookup extends CategoryLookup {
  constructor(private readonly categories: CategoriesService) {
    super();
  }

  isUsable(categoryId: string, ownerId: string): Promise<boolean> {
    return this.categories.isUsable({ id: categoryId, ownerId });
  }

  findOrCreate(category: TypedCategory, ownerId: string): Promise<string> {
    return this.categories.findOrCreate(category, ownerId);
  }
}
