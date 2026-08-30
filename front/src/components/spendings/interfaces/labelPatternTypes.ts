/**
 * One bucket of the "Breakdown by label pattern" widget of the category detail
 * modal (PFA-168) — built by `groupSpendingsByLabelPattern`, rendered by
 * `LabelPatternBreakdown`.
 */
export interface LabelPatternGroup {
  /** Normalized key token, or `OTHER_GROUP_KEY` for the catch-all bucket. */
  key: string;
  /**
   * Most frequent original spelling of the key token, capitalized ("Vélo").
   * Empty for the catch-all bucket: its name is UI copy, so it comes from
   * `@text` at render time rather than from this pure helper.
   */
  name: string;
  total: number;
  count: number;
  /** Share of the displayed total, in percent (all groups sum to 100). */
  pct: number;
  /** IDs of the spendings in the group, in input order. */
  ids: string[];
  isOther: boolean;
}
