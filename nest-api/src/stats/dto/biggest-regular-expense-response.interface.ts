/**
 * The single biggest one-off (non-exceptional) expense of a year
 * (GET /biggest-regular-expense?year=YYYY).
 *
 * Read from the one-off `Spendings` table only — recurrings and exceptionals
 * live in their own tables — so the row is a real "hors récurrent / hors
 * exceptionnel" spending; no itemType filter is needed. Backs the "courante" row
 * of the Statistiques "Plus grosse dépense" KPI card (COS-46).
 */
export interface BiggestRegularExpense {
  /** The spending's label. */
  label: string;
  /** Its amount, rounded to the cent. */
  amount: number;
  /** ISO date (YYYY-MM-DD, UTC) of the spending. */
  date: string;
  /** Category name, or null for an uncategorized spending. */
  categoryName: string | null;
  /** Category color, or null for an uncategorized spending. */
  categoryColor: string | null;
}

export interface BiggestRegularExpenseResponse {
  /** The biggest regular expense of the year, or null when there is none. */
  expense: BiggestRegularExpense | null;
}
