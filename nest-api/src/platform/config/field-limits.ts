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
  /**
   * A group's store/name and a group line's detail (PFA-189). Each line's
   * `label` is composed as "<group> — <detail>" and must fit `label`:
   * 40 + 3 + 57 = 100.
   */
  groupLabel: 40,
  groupDetail: 57,
  /** `ReceiptLines.label` — one line read on a receipt (PFA-214). */
  receiptLineLabel: 100,
  /** `Stores.name` — a shop as read on its receipts (PFA-218). */
  storeName: 60,
  /** `Stores.address` — street and city as read on its receipts (PFA-219). */
  storeAddress: 120,
  /** `ProductTypes.name` — a generic product such as "Liquid soap" (PFA-219). */
  productTypeName: 40,
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
