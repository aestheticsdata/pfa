import type { TypedCategory } from "@contexts/spending/domain/interfaces/spendingTypes";

/**
 * What the Spending context asks of the categories (PFA-273). Categories belong to budget planning;
 * this is the customer side of that relationship, and the adapter translates.
 */
export abstract class CategoryLookup {
  /** One of the user's own categories, or a global one. */
  abstract isUsable(categoryId: string, ownerId: string): Promise<boolean>;
  /** The user's category of that name, created when there is none. */
  abstract findOrCreate(category: TypedCategory, ownerId: string): Promise<string>;
}
