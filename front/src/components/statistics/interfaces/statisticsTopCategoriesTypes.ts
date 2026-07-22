/**
 * One row of the "Top categories" table — built by StatisticsView, rendered by
 * StatisticsTopCategories.
 */
export interface TopCategoryRow {
  name: string;
  color: string;
  value: number;
  /** Year-over-year change in %, or null when the category is new this year. */
  deltaPct: number | null;
  /** The compare-year total for this category (0 when absent that year). */
  compareValue: number;
}
