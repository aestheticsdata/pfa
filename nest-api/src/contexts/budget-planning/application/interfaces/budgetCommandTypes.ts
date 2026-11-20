import type { CategoryPick } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

export interface NewRecurringInput {
  ownerId: string;
  start: string;
  end: string;
  label: string;
  amount: number;
  currency?: string;
  category?: CategoryPick;
}

export interface RecurringEditInput {
  label: string;
  amount: number;
  category?: CategoryPick;
}

/** Last month's charges, carried into the month from `start` to `end`. */
export interface CopiedMonth {
  ownerId: string;
  start: string;
  end: string;
  previousMonthStart: string;
}

export interface ExceptionalInput {
  date: string;
  label: string;
  description?: string;
  amount: number;
  currency?: string;
  categoryName?: string;
  categoryColor?: string;
}

export interface MonthlyBudgetInput {
  start: string;
  end: string;
  amount: number;
}
