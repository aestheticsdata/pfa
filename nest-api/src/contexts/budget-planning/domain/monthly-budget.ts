import type { BudgetEdit, BudgetRevision } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/**
 * What an edit of the month's budget writes: the income (`initialAmount`) and the spending ceiling
 * (`initialCeiling`), each only when sent. Null when there is nothing to write.
 */
export function budgetRevision(edit: BudgetEdit): BudgetRevision | null {
  const revision: BudgetRevision = {};
  if (edit.amount !== undefined && edit.amount !== null) revision.initialAmount = edit.amount;
  if (edit.ceiling !== undefined && edit.ceiling !== null) revision.initialCeiling = edit.ceiling;
  return Object.keys(revision).length > 0 ? revision : null;
}
