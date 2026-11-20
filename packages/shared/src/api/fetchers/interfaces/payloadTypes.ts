import type { RecurringMutationPayload } from "#schemas/spendings";

/** POST /dashboard: a month's budget, from its 1st to its last day. */
export interface DashboardCreatePayload {
  start: string;
  end: string;
  amount: number;
}

/** PUT /dashboard/:id: the budget, the weekly ceiling, or both. */
export interface DashboardUpdatePayload {
  amount?: number;
  ceiling?: number;
}

/** A month as the recurrings routes take it: its 1st and last day, yyyy-MM-dd. */
export interface MonthBounds {
  start: string;
  end: string;
}

/** POST /recurrings: the fixed expense and the month it belongs to. */
export interface RecurringCreateInput {
  payload: RecurringMutationPayload;
  month: MonthBounds;
}
