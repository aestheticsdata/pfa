/**
 * Row of the weekly "Répartition par catégorie" breakdown — built by
 * SpendingView, rendered by SpendingCategoryBreakdown.
 */
export interface BreakdownRow {
  key: string;
  category: string | null;
  name: string;
  color: string;
  count: number;
  total: number;
  pct: number;
}
