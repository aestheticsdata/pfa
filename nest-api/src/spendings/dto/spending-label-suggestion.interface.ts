/**
 * One label autocomplete suggestion for the spending modal
 * (GET /spendings/label-suggestions?q=prefix, COS-23).
 *
 * The user's own past spending labels, ranked by how often they've been used and
 * filtered by the typed prefix, each carrying the category it's most often paired
 * with so selecting a suggestion can pre-fill that category.
 */
export interface SpendingLabelSuggestion {
  /** A past spending label of the user's. */
  label: string;
  /** Its most-used category name, or null when the label was only ever uncategorized. */
  category: string | null;
}
