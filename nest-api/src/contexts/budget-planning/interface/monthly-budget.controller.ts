import { MonthlyBudgetService } from "@contexts/budget-planning/application/monthly-budget.service";
import { CreateDashboardDto } from "@contexts/budget-planning/interface/dto/create-dashboard.dto";
import { DashboardQueryDto } from "@contexts/budget-planning/interface/dto/dashboard-query.dto";
import { UpdateDashboardDto } from "@contexts/budget-planning/interface/dto/update-dashboard.dto";
import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";

/** A month's budget (PFA-276), on the `/dashboard` routes it has always had. */
@Controller("dashboard")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class MonthlyBudgetController {
  constructor(private readonly budgets: MonthlyBudgetService) {}

  /** `res.json` so a month with no budget answers `null`, not an empty body. */
  @Get()
  async forMonth(@Query() query: DashboardQueryDto, @GetUserId() userID: string, @Res() res: Response) {
    res.json(await this.budgets.forMonth(query.start, userID));
  }

  @Post()
  async open(@Body() dto: CreateDashboardDto, @GetUserId() userID: string) {
    return this.budgets.open({ start: dto.start, end: dto.end, amount: dto.amount }, userID);
  }

  @Put(":id")
  async revise(@Param("id") id: string, @Body() dto: UpdateDashboardDto, @GetUserId() userID: string) {
    return this.budgets.revise({ id, ownerId: userID }, { amount: dto.amount, ceiling: dto.ceiling });
  }
}
