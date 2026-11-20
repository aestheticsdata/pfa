import { CATEGORY_CHOICE } from "@contexts/spending/domain/category-choice";
import type { CategoryChoice } from "@contexts/spending/domain/interfaces/spendingTypes";
import type { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { CategoryNotUsable } from "@contexts/spending/domain/spending-errors";

/** The category ID a choice comes to, checked or created through the lookup (PFA-273). */
export async function resolveCategory(
  choice: CategoryChoice,
  ownerId: string,
  lookup: CategoryLookup,
): Promise<string | null> {
  switch (choice.kind) {
    case CATEGORY_CHOICE.unchanged:
      return choice.categoryId;
    case CATEGORY_CHOICE.existing:
      if (!(await lookup.isUsable(choice.categoryId, ownerId))) throw new CategoryNotUsable();
      return choice.categoryId;
    case CATEGORY_CHOICE.typed:
      return lookup.findOrCreate(choice.category, ownerId);
    case CATEGORY_CHOICE.none:
      return null;
  }
}
