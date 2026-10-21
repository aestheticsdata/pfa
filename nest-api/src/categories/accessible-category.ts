/** The joined category's fields the flattening reads. */
interface JoinedCategory {
  userID: string | null;
  name: string;
  color: string;
}

/** What `select` asks of a row's category to flatten it (PFA-257). */
export const JOINED_CATEGORY_SELECT = { select: { userID: true, name: true, color: true } } as const;

/**
 * A row's category flattened to name and colour (PFA-38) — nulled out, defensively, when it
 * belongs to another user rather than to this one or to everyone.
 */
export function accessibleCategory(category: JoinedCategory | null, userID: string) {
  const isAccessible = category !== null && (category.userID === userID || category.userID === null);
  return {
    category: isAccessible ? category.name : null,
    categoryColor: isAccessible ? category.color : null,
  };
}
