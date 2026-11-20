import { CategoryStatsQueries } from "@contexts/analytics/infrastructure/queries/category-stats.queries";
import { DashboardQueries } from "@contexts/analytics/infrastructure/queries/dashboard.queries";
import { SpendingsStatsQueries } from "@contexts/analytics/infrastructure/queries/spendings-stats.queries";
import { YearlyStatsQueries } from "@contexts/analytics/infrastructure/queries/yearly-stats.queries";
import { DashboardController } from "@contexts/analytics/interface/dashboard.controller";
import {
  BiggestRegularExpenseController,
  BusiestWeekController,
  CategoryStatsController,
  CategoryTrendsController,
  DailyStatsController,
  MonthlyStatsController,
  RegularMonthlyAverageController,
  SearchTimelineController,
  SpendingPaceController,
  StatisticsController,
  WeekdayCategoriesController,
  WeeklyStatsController,
} from "@contexts/analytics/interface/stats.controller";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

/**
 * The analytics context (PFA-277): the read side only. Statistics, trends and the dashboard's
 * projection read the rows directly, shaped per screen — no aggregate is loaded to be summed.
 * The calculations themselves are pure functions in `domain/`.
 */
@Module({
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
    DashboardController,
  ],
  providers: [CategoryStatsQueries, SpendingsStatsQueries, YearlyStatsQueries, DashboardQueries, SessionAuthGuard],
})
export class AnalyticsModule {}
