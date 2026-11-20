import type {
  BudgetRevision,
  DashboardItem,
  NewMonthlyBudget,
  OwnedRecord,
  StoredMonthlyBudget,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";

/** A month's budget — income and ceiling — kept as the `Dashboards` row (PFA-276). */
export abstract class MonthlyBudgetRepository {
  abstract forMonth(start: Date, ownerId: string): Promise<DashboardItem | null>;
  abstract add(budget: NewMonthlyBudget, ownerId: string): Promise<string>;
  abstract byId(budget: OwnedRecord): Promise<StoredMonthlyBudget | null>;
  abstract revise(budgetId: string, revision: BudgetRevision): Promise<StoredMonthlyBudget>;
}
