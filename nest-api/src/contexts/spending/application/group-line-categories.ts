import { chosenCategory } from "@contexts/budget-planning/domain/category-choice";
import { resolveCategory } from "@contexts/spending/application/category-resolution";
import type { GroupLineInput } from "@contexts/spending/application/interfaces/spendingCommandTypes";
import type { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";

/** Each line's category, resolved in order: two lines typing the same new name create it once. */
export async function resolveLineCategories(
  lines: GroupLineInput[],
  ownerId: string,
  lookup: CategoryLookup,
): Promise<(string | null)[]> {
  const ids: (string | null)[] = [];
  for (const line of lines) {
    ids.push(await resolveCategory(chosenCategory(line.category), ownerId, lookup));
  }
  return ids;
}
