import { randomUUID } from "node:crypto";
import type {
  BudgetRevision,
  DashboardItem,
  NewMonthlyBudget,
  OwnedRecord,
  StoredMonthlyBudget,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { MonthlyBudgetRepository } from "@contexts/budget-planning/domain/ports/monthly-budget.repository";
import { PrismaService } from "@db/prisma.service";
import type { Prisma } from "@generated/prisma/client";
import { Injectable } from "@nestjs/common";

type BudgetRow = Prisma.DashboardsGetPayload<object>;

/** The whole row, its Decimals as the text JSON would have carried them. */
const stored = (row: BudgetRow): StoredMonthlyBudget => ({
  ID: row.ID,
  dateFrom: row.dateFrom,
  dateTo: row.dateTo,
  initialAmount: row.initialAmount.toString(),
  userID: row.userID,
  initialCeiling: row.initialCeiling === null ? null : row.initialCeiling.toString(),
});

@Injectable()
export class PrismaMonthlyBudgetRepository extends MonthlyBudgetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async forMonth(start: Date, ownerId: string): Promise<DashboardItem | null> {
    const dashboard = await this.prisma.dashboards.findFirst({
      where: { userID: ownerId, dateFrom: start },
      // Listed, never the whole row: a new column stays out of the response until asked for (PFA-257).
      select: { ID: true, dateFrom: true, dateTo: true, initialAmount: true, initialCeiling: true },
    });
    if (!dashboard) return null;
    return {
      ...dashboard,
      initialAmount: Number(dashboard.initialAmount),
      initialCeiling: dashboard.initialCeiling ? Number(dashboard.initialCeiling) : null,
    };
  }

  async add(budget: NewMonthlyBudget, ownerId: string): Promise<string> {
    const ID = randomUUID();
    await this.prisma.dashboards.create({
      data: { ID, dateFrom: budget.start, dateTo: budget.end, initialAmount: budget.amount, userID: ownerId },
    });
    return ID;
  }

  async byId(budget: OwnedRecord): Promise<StoredMonthlyBudget | null> {
    const row = await this.prisma.dashboards.findFirst({ where: { ID: budget.id, userID: budget.ownerId } });
    return row && stored(row);
  }

  async revise(budgetId: string, revision: BudgetRevision): Promise<StoredMonthlyBudget> {
    return stored(await this.prisma.dashboards.update({ where: { ID: budgetId }, data: revision }));
  }
}
