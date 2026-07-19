/**
 * Per-category spending totals for two periods (GET /category-trends): the
 * current window and the one it is compared against. Feeds the dashboard's
 * monthly "Répartition par catégorie" trend column + "Catégorie en hausse"
 * insight (COS-41), and later the Dépenses weekly breakdown (COS-35).
 *
 * One entry per category with spending in the CURRENT window, sorted by current
 * amount desc (matching the breakdown bar/list order). `previousValue` is null
 * when the category had no spending in the comparison window (rendered "nouv.").
 * The delta % and its hausse/baisse/stable/nouv. styling are derived on the
 * front, so the backend stays a thin totals provider.
 *
 * @example
 * {
 *   trends: [
 *     { category: "abonnements", categoryColor: "#7c3aed", value: 128.4, previousValue: 103.5 },
 *     { category: "transports", categoryColor: "#0ea5e9", value: 42, previousValue: null },
 *     { category: null, categoryColor: null, value: 12.9, previousValue: 30 },
 *   ]
 * }
 */
export interface CategoryTrendPoint {
  /** Category name; null = uncategorized. */
  category: string | null;
  /** Category colour; null = uncategorized/fallback. */
  categoryColor: string | null;
  /** Total spent on the category in the current window. */
  value: number;
  /** Total spent in the comparison window, or null when the category is new to it. */
  previousValue: number | null;
}

export interface CategoryTrendsResponse {
  trends: CategoryTrendPoint[];
}
