import type { TypedCategory } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";

/** Usable categories are listed up front; a typed one is "created" as `new:<name>`, once. */
export class FakeCategoryLookup extends CategoryLookup {
  readonly created: string[] = [];

  constructor(private readonly usable: string[] = []) {
    super();
  }

  async isUsable(categoryId: string): Promise<boolean> {
    return this.usable.includes(categoryId);
  }

  async findOrCreate(category: TypedCategory): Promise<string> {
    const id = `new:${category.name}`;
    if (!this.usable.includes(id)) {
      this.usable.push(id);
      this.created.push(id);
    }
    return id;
  }
}
