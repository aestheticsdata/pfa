import type { CategoryChoice, CategoryPick } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/** What a category pick asks for (PFA-273); budget planning owns the categories (PFA-276). */
export const CATEGORY_CHOICE = {
  /** An existing category, which must be usable by the user. */
  existing: "existing",
  /** The category the spending already has: nothing to check. */
  unchanged: "unchanged",
  /** A name typed in the modal: reused if the user has it, created otherwise. */
  typed: "typed",
  none: "none",
} as const;

/**
 * The category of a new spending or a group line. A typed category needs an explicit `ID: null`
 * next to its name and colour: an absent ID means no category.
 */
export function chosenCategory(pick: CategoryPick | undefined): CategoryChoice {
  if (pick?.ID) return { kind: CATEGORY_CHOICE.existing, categoryId: pick.ID };
  if (pick?.ID === null && pick.color != null && pick.name) {
    return { kind: CATEGORY_CHOICE.typed, category: { name: pick.name, color: pick.color } };
  }
  return { kind: CATEGORY_CHOICE.none };
}

/**
 * The category of an edited spending. Keeping the current one checks nothing; without an ID, a
 * name and a colour are enough to type one (the edit modal sends no explicit null).
 */
export function revisedCategory(pick: CategoryPick | undefined, currentId: string | null): CategoryChoice {
  if (pick?.ID) {
    return pick.ID === currentId
      ? { kind: CATEGORY_CHOICE.unchanged, categoryId: pick.ID }
      : { kind: CATEGORY_CHOICE.existing, categoryId: pick.ID };
  }
  if (pick?.name && pick.color) {
    return { kind: CATEGORY_CHOICE.typed, category: { name: pick.name, color: pick.color } };
  }
  return { kind: CATEGORY_CHOICE.none };
}
