import { CategoriesService } from "@contexts/budget-planning/application/categories.service";
import { ExceptionalsService } from "@contexts/budget-planning/application/exceptionals.service";
import { MonthlyBudgetService } from "@contexts/budget-planning/application/monthly-budget.service";
import { RecurringsService } from "@contexts/budget-planning/application/recurrings.service";
import { CategoryRepository } from "@contexts/budget-planning/domain/ports/category.repository";
import { ExceptionalRepository } from "@contexts/budget-planning/domain/ports/exceptional.repository";
import { MonthlyBudgetRepository } from "@contexts/budget-planning/domain/ports/monthly-budget.repository";
import { RecurringRepository } from "@contexts/budget-planning/domain/ports/recurring.repository";
import { PrismaCategoryRepository } from "@contexts/budget-planning/infrastructure/prisma-category.repository";
import { PrismaExceptionalRepository } from "@contexts/budget-planning/infrastructure/prisma-exceptional.repository";
import { PrismaMonthlyBudgetRepository } from "@contexts/budget-planning/infrastructure/prisma-monthly-budget.repository";
import { PrismaRecurringRepository } from "@contexts/budget-planning/infrastructure/prisma-recurring.repository";
import { CategoriesController } from "@contexts/budget-planning/interface/categories.controller";
import { ExceptionalsController } from "@contexts/budget-planning/interface/exceptionals.controller";
import { MonthlyBudgetController } from "@contexts/budget-planning/interface/monthly-budget.controller";
import { RecurringsController } from "@contexts/budget-planning/interface/recurrings.controller";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { Module } from "@nestjs/common";

/** The budget planning context (PFA-276): categories, recurring charges, exceptionals, the month's budget. */
@Module({
  controllers: [CategoriesController, RecurringsController, ExceptionalsController, MonthlyBudgetController],
  providers: [
    CategoriesService,
    RecurringsService,
    ExceptionalsService,
    MonthlyBudgetService,
    SessionAuthGuard,
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    { provide: RecurringRepository, useClass: PrismaRecurringRepository },
    { provide: ExceptionalRepository, useClass: PrismaExceptionalRepository },
    { provide: MonthlyBudgetRepository, useClass: PrismaMonthlyBudgetRepository },
  ],
  // The Spending context checks and creates categories through this (customer of budget planning).
  exports: [CategoriesService],
})
export class BudgetPlanningModule {}
