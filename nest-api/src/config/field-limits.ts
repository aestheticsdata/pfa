/**
 * Maximum lengths of the user-writable text columns, mirroring
 * `prisma/schema.prisma` (COS-180). Nothing validated a length before: an
 * oversized input travelled all the way to MySQL and came back as a raw SQL
 * error instead of a form message.
 *
 * The front mirrors this table in `front/src/schemas/fieldLimits.ts` — the two
 * must move together, and both only ever move with the column.
 */
export const FIELD_LIMITS = {
  /** `Spendings.label` and `Recurrings.label` — same width. */
  label: 100,
  /** `Exceptionals.description`. */
  description: 255,
  /** `Categories.name` — the categories the spendings reference. */
  categoryName: 20,
  /**
   * `Exceptionals.categoryName` — exceptionals keep their category inline
   * instead of referencing `Categories`, and the column is wider. Bounded on its
   * own column, as the ticket asks; the divergence with `categoryName` predates
   * COS-180.
   */
  exceptionalCategoryName: 50,
  /** `Categories.color` and `Exceptionals.categoryColor` — hex, never near it. */
  color: 20,
  /** `Users.name`. */
  userName: 20,
  /** `Users.email`. */
  email: 250,
  /** `*.currency` and `Users.baseCurrency` — ISO 4217 codes. */
  currency: 3,
  /** `Users.language` — locale keys. */
  language: 3,
} as const;
