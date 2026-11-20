import type {
  CategoryEdit,
  CategoryItem,
  OwnedRecord,
  TypedCategory,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/** The categories (PFA-276): the user's own, and the global ones every user sees (`userID` null). */
export abstract class CategoryRepository {
  /** The user's own categories. */
  abstract list(ownerId: string): Promise<CategoryItem[]>;
  /** One of the user's own, or a global one. */
  abstract isUsable(category: OwnedRecord): Promise<boolean>;
  abstract ownedBy(category: OwnedRecord): Promise<boolean>;
  abstract findByName(name: string, ownerId: string): Promise<string | null>;
  abstract create(category: TypedCategory, ownerId: string): Promise<string>;
  /** False when the category is not the user's own. */
  abstract edit(category: OwnedRecord, edit: CategoryEdit): Promise<boolean>;
  /** Spendings and recurrings keep their rows, uncategorized, and the category goes. */
  abstract removeDetaching(categoryId: string): Promise<void>;
}
