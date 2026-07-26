/**
 * Maximum lengths of the user-writable text fields, mirroring the `VarChar`
 * columns they land in (COS-180). Nothing validated a length before: an
 * oversized input travelled all the way to MySQL and came back as a raw SQL
 * error instead of a form message.
 *
 * The backend mirrors this table in `nest-api/src/config/field-limits.ts`, where
 * a spec asserts it against `schema.prisma` — the two must move together, and
 * both only ever move with the column.
 */
export const FIELD_LIMITS = {
  /** `Spendings.label` and `Recurrings.label` — the spending modal's label. */
  label: 100,
  /** `Exceptionals.description`. */
  description: 255,
  /** `Categories.name` — the categories the spendings reference. */
  categoryName: 20,
  /**
   * `Exceptionals.categoryName` — exceptionals keep their category inline
   * instead of referencing `Categories`, and the column is wider. Each field is
   * bounded on its own column; the divergence predates COS-180.
   */
  exceptionalCategoryName: 50,
  /** `Users.name` — derived from the email's local part at signup. */
  userName: 20,
  /** `Users.email`. */
  email: 250,
} as const;
