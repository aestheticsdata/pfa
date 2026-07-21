/**
 * Dominant spending category per weekday for a year (GET /weekday-categories?year=YYYY).
 *
 * For each weekday (Monday..Sunday), the category with the highest total one-off
 * spend on that weekday across the year. Reads the `Spendings` table only —
 * recurrings and exceptionals live in their own tables — so it shares the "hors
 * récurrent / hors exceptionnel" scope of the daily stats (COS-45). Backs the
 * hover tooltip of the day-of-week widget (COS-127).
 */
export interface WeekdayCategory {
  /** Category name, or null when that weekday has no categorized spending. */
  name: string | null;
  /** Category colour, or null. */
  color: string | null;
}

export interface WeekdayCategoriesResponse {
  /** Length 7, index 0 = Monday … 6 = Sunday. */
  weekdays: WeekdayCategory[];
}
