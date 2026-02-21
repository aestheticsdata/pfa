import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { DashboardService } from "@dashboard/dashboard.service";
import { DashboardQueryDto } from "@dashboard/dto/dashboard-query.dto";
import { CreateDashboardDto } from "@dashboard/dto/create-dashboard.dto";
import { UpdateDashboardDto } from "@dashboard/dto/update-dashboard.dto";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query() query: DashboardQueryDto, @GetUserId() userID: string, @Res() res: Response) {
    const result = await this.dashboardService.getDashboard(query.start, userID);
    res.json(result);
  }

  @Post()
  async createDashboard(@Body() dto: CreateDashboardDto, @GetUserId() userID: string) {
    return this.dashboardService.createDashboard(
      {
        start: dto.start,
        end: dto.end,
        amount: dto.amount,
      },
      userID,
    );
  }

  @Put(":id")
  async updateDashboard(@Param("id") id: string, @Body() dto: UpdateDashboardDto, @GetUserId() userID: string) {
    return this.dashboardService.updateDashboard(id, userID, {
      amount: dto.amount,
      ceiling: dto.ceiling,
    });
  }
}
