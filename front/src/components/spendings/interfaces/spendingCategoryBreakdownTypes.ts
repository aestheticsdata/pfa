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
  /**
   * Total spent on this category the previous week — the comparison for the
   * trend badge (COS-35). `null` = new category ("nouv."); `undefined` = the
   * previous-week data has not loaded yet (badge hidden until it does).
   */
  previousValue?: number | null;
}
