import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { StatsService } from "@stats/stats.service";
import { WeeklyStatsQueryDto } from "@stats/dto/weekly-stats-query.dto";
import { MonthlyStatsQueryDto } from "@stats/dto/monthly-stats-query.dto";
import { StatisticsQueryDto } from "@stats/dto/statistics-query.dto";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";

@Controller("weeklystats")
@UseGuards(JwtAuthGuard)
export class WeeklyStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getWeeklyStats(@Query() query: WeeklyStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getWeeklyStats(query.start, userID);
  }
}

@Controller("monthlystats")
@UseGuards(JwtAuthGuard)
export class MonthlyStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getMonthlyStats(@Query() query: MonthlyStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getMonthlyStats(query.from, userID);
  }
}

@Controller("statistics")
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStatistics(@Query() query: StatisticsQueryDto, @GetUserId() userID: string) {
    const categoryIDs = query.categories
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const years = query.years
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return this.statsService.getStatistics(categoryIDs, years, userID);
  }
}
