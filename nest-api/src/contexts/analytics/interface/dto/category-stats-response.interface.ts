/**
 * Per-category usage aggregate over all history (GET /category-stats).
 *
 * totalSpent: sum of every spending amount for the user, including uncategorized
 *   ones. Used as the denominator for each category's share of total spending.
 * byCategory: one entry per category that has at least one spending. Uncategorized
 *   spendings (categoryID = null) are excluded here but still counted in totalSpent.
 *
 * @example
 * {
 *   totalSpent: 4820.5,
 *   byCategory: [
 *     { categoryID: "b1a2...", count: 42, total: 1680.9 },
 *     { categoryID: "c3d4...", count: 7, total: 320 },
 *   ]
 * }
 */
export interface CategoryStat {
  categoryID: string;
  /** number of spendings attached to the category (all history) */
  count: number;
  /** total amount spent on the category (all history) */
  total: number;
}

export interface CategoryStatsResponse {
  totalSpent: number;
  byCategory: CategoryStat[];
}
