import type {
  DayRange,
  MonthSpan,
  NewRecurring,
  RecurringCharge,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

const LAST_MONTH = 11;

/**
 * A new month starts with last month's charges (COS-49): recurrings are stored one row per month,
 * copied forward, so each month keeps what was really committed — label, amount, category.
 */
export function carriedForward(previous: RecurringCharge[], month: MonthSpan): (RecurringCharge & MonthSpan)[] {
  return previous.map((charge) => ({ ...charge, ...month }));
}

/**
 * "Déjà prélevé" (COS-49): January through the client's current month, inclusive, as a half-open
 * UTC range. Null for a year or month that is not one.
 */
export function drawnWindow(yearText: string, monthText: string): DayRange | null {
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > LAST_MONTH) return null;
  return { from: new Date(Date.UTC(year, 0, 1)), until: new Date(Date.UTC(year, month + 1, 1)) };
}

/** A recurring as a new month's row. */
export function recurringOf(input: NewRecurring): RecurringCharge & MonthSpan {
  return { ...input, itemType: RECURRING_ITEM_TYPE };
}

/** Every recurring row says what it is: the column predates the contexts. */
export const RECURRING_ITEM_TYPE = "recurring";
