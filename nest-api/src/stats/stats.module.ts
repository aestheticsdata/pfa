import { Module } from "@nestjs/common";
import { CategoryStatsService } from "@stats/services/category-stats.service";
import { SpendingsStatsService } from "@stats/services/spendings-stats.service";
import { YearlyStatsService } from "@stats/services/yearly-stats.service";
import {
  WeeklyStatsController,
  MonthlyStatsController,
  StatisticsController,
  RegularMonthlyAverageController,
  CategoryStatsController,
  CategoryTrendsController,
  BusiestWeekController,
  SpendingPaceController,
  DailyStatsController,
  BiggestRegularExpenseController,
  WeekdayCategoriesController,
  SearchTimelineController,
} from "@stats/stats.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [PrismaModule],
  controllers: [
    WeeklyStatsController,
    MonthlyStatsController,
    StatisticsController,
    RegularMonthlyAverageController,
    CategoryStatsController,
    CategoryTrendsController,
    BusiestWeekController,
    SpendingPaceController,
    DailyStatsController,
    BiggestRegularExpenseController,
    WeekdayCategoriesController,
    SearchTimelineController,
  ],
  providers: [SpendingsStatsService, YearlyStatsService, CategoryStatsService, SessionAuthGuard],
})
export class StatsModule {}
