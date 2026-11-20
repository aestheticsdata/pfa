import type { ClosedRange } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/**
 * The years the user has exceptionals in, newest first, each once. Read in the server's local time,
 * as it always has been: the column is a `@db.Date`, the year of a 1 January row is the same either way
 * except at the very first hours of the year.
 */
export function yearsOf(dates: Date[]): number[] {
  return [...new Set(dates.map((date) => date.getFullYear()))].sort((a, b) => b - a);
}

/** The whole year as a closed range, as the exceptionals screen asks for it; null for no year. */
export function yearSpan(yearText: string | undefined): ClosedRange | null {
  if (!yearText) return null;
  const year = Number.parseInt(yearText, 10);
  if (Number.isNaN(year)) return null;
  return { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) };
}

export const EXCEPTIONAL_ITEM_TYPE = "exceptional";
