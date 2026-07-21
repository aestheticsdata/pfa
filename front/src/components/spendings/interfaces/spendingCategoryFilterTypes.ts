/**
 * One selectable category in the Dépenses global filter — built by
 * SpendingView, rendered by SpendingCategoryFilter.
 */
export interface FilterCategory {
  key: string;
  name: string;
  color: string;
  count: number;
}
