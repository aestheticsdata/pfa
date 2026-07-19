import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { StatsService } from "@stats/stats.service";
import { WeeklyStatsQueryDto } from "@stats/dto/weekly-stats-query.dto";
import { MonthlyStatsQueryDto } from "@stats/dto/monthly-stats-query.dto";
import { StatisticsQueryDto } from "@stats/dto/statistics-query.dto";
import { RegularMonthlyAverageQueryDto } from "@stats/dto/regular-monthly-average-query.dto";
import { DailyStatsQueryDto } from "@stats/dto/daily-stats-query.dto";
import { CategoryStatsQueryDto } from "@stats/dto/category-stats-query.dto";
import { BiggestRegularExpenseQueryDto } from "@stats/dto/biggest-regular-expense-query.dto";
import { CategoryTrendsQueryDto } from "@stats/dto/category-trends-query.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";

@Controller("weeklystats")
@UseGuards(SessionAuthGuard)
export class WeeklyStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getWeeklyStats(@Query() query: WeeklyStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getWeeklyStats(query.start, userID);
  }
}

@Controller("monthlystats")
@UseGuards(SessionAuthGuard)
export class MonthlyStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getMonthlyStats(@Query() query: MonthlyStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getMonthlyStats(query.from, userID);
  }
}

@Controller("statistics")
@UseGuards(SessionAuthGuard)
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

@Controller("regular-monthly-average")
@UseGuards(SessionAuthGuard)
export class RegularMonthlyAverageController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getRegularMonthlyAverage(@Query() query: RegularMonthlyAverageQueryDto, @GetUserId() userID: string) {
    return this.statsService.getRegularMonthlyAverage(query.year, userID);
  }
}

@Controller("category-stats")
@UseGuards(SessionAuthGuard)
export class CategoryStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getCategoryStats(@Query() query: CategoryStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getCategoryStats(userID, query.from, query.to);
  }
}

@Controller("category-trends")
@UseGuards(SessionAuthGuard)
export class CategoryTrendsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getCategoryTrends(@Query() query: CategoryTrendsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getCategoryTrends(userID, query.from, query.to, query.prevFrom, query.prevTo);
  }
}

@Controller("daily-stats")
@UseGuards(SessionAuthGuard)
export class DailyStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getDailyStats(@Query() query: DailyStatsQueryDto, @GetUserId() userID: string) {
    return this.statsService.getDailyStats(query.year, userID);
  }
}

@Controller("biggest-regular-expense")
@UseGuards(SessionAuthGuard)
export class BiggestRegularExpenseController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getBiggestRegularExpense(@Query() query: BiggestRegularExpenseQueryDto, @GetUserId() userID: string) {
    return this.statsService.getBiggestRegularExpense(query.year, userID);
  }
}
