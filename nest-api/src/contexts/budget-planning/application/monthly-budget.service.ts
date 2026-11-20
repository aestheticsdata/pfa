import type { MonthlyBudgetInput } from "@contexts/budget-planning/application/interfaces/budgetCommandTypes";
import { MonthlyBudgetNotFound } from "@contexts/budget-planning/domain/budget-errors";
import type {
  BudgetEdit,
  DashboardItem,
  OwnedRecord,
  StoredMonthlyBudget,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { budgetRevision } from "@contexts/budget-planning/domain/monthly-budget";
import { MonthlyBudgetRepository } from "@contexts/budget-planning/domain/ports/monthly-budget.repository";
import { Injectable } from "@nestjs/common";

/** A month's budget (PFA-276): the income it starts with and the ceiling not to pass. */
@Injectable()
export class MonthlyBudgetService {
  constructor(private readonly budgets: MonthlyBudgetRepository) {}

  forMonth(start: string, ownerId: string): Promise<DashboardItem | null> {
    return this.budgets.forMonth(new Date(start), ownerId);
  }

  async open(input: MonthlyBudgetInput, ownerId: string): Promise<{ insertId: string; ID: string }> {
    const ID = await this.budgets.add(
      { start: new Date(input.start), end: new Date(input.end), amount: input.amount },
      ownerId,
    );
    return { insertId: ID, ID };
  }

  /** The whole row back, revised or not. */
  async revise(budget: OwnedRecord, edit: BudgetEdit): Promise<StoredMonthlyBudget> {
    const existing = await this.budgets.byId(budget);
    if (!existing) throw new MonthlyBudgetNotFound();
    const revision = budgetRevision(edit);
    return revision ? this.budgets.revise(budget.id, revision) : existing;
  }
}
