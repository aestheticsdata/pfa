export type OverspendLevel = "normal" | "warn" | "danger";

/**
 * The total turns red only once it exceeds its budget by this factor; between
 * the budget and this multiple it stays orange. Single knob shared by the two
 * Dépenses overspend indicators (COS-34 day-cards, COS-36 weekly ceiling) so
 * they always agree — tune here.
 */
export const OVERSPEND_DANGER_RATIO = 2;

/**
 * Three-state overspend level shared by the Dépenses day-card totals (COS-34,
 * day total vs the day's share of the weekly ceiling) and the weekly
 * "vs plafond" widget (COS-36, week total vs the ceiling), so both use the exact
 * same orange→red rule:
 *
 * - `normal` — at or under budget
 * - `warn`   — over budget, up to `OVERSPEND_DANGER_RATIO`× budget (orange)
 * - `danger` — beyond that (red)
 *
 * A null or non-positive budget (no ceiling defined) is always `normal`.
 */
export default function overspendLevel(value: number, budget: number | null): OverspendLevel {
  if (budget == null || budget <= 0 || value <= budget) {
    return "normal";
  }
  return value > budget * OVERSPEND_DANGER_RATIO ? "danger" : "warn";
}
