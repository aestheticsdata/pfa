// Text-match building blocks shared by the whole-history search (COS-114) and
// the statistics search timeline (COS-160). Both features answer "which
// spendings match this term?" — one clause, one truth: if the matching logic
// ever diverges, the timeline's totals and the Dashboard search results would
// disagree for the same term.

// Require a minimal query so a stray keystroke can't scan the entire table.
// Kept in sync with SEARCH_MIN_LENGTH on the front.
export const MIN_SEARCH_LENGTH = 2;

/**
 * Escapes LIKE metacharacters so a literal % or _ in the term (e.g. "100%",
 * "T_Mobile") matches literally instead of acting as a wildcard. MySQL's
 * default LIKE escape is backslash; the single pass escapes the backslash too.
 */
export const escapeLikeQuery = (query: string): string => query.replace(/[\\%_]/g, "\\$&");

/**
 * The Prisma where fragment matching a spending's label OR its (accessible)
 * category name against an already-escaped term. Case-insensitivity comes from
 * the MySQL collation (Prisma/MySQL has no `mode: "insensitive"`).
 */
export const spendingSearchTextWhere = (escapedQuery: string) => ({
  OR: [{ label: { contains: escapedQuery } }, { category: { is: { name: { contains: escapedQuery } } } }],
});
