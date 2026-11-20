import { DashboardQueries } from "@contexts/analytics/infrastructure/queries/dashboard.queries";
import { MonthlyIncomeQueryDto } from "@contexts/analytics/interface/dto/monthly-income-query.dto";
import { DashboardQueryDto } from "@contexts/budget-planning/interface/dto/dashboard-query.dto";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("dashboard")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardQueries) {}

  // Day-by-day totals of the historical reference period (COS-27), used to draw
  // the in-progress month's projected sparkline tail. `start` = viewed month's
  // first day (ISO date).
  @Get("projection")
  async getDailyProjection(@Query() query: DashboardQueryDto, @GetUserId() userID: string) {
    return this.dashboardService.getDailyProjection(query.start, userID);
  }

  // Per-month income (dashboard initialAmount) for a year (COS-50), backing the
  // monthly chart's stepped budget line.
  @Get("monthly-income")
  async getMonthlyIncome(@Query() query: MonthlyIncomeQueryDto, @GetUserId() userID: string) {
    return this.dashboardService.getMonthlyIncome(query.year, userID);
  }
}
