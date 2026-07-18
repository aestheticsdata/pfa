import { Module } from "@nestjs/common";
import { StatsService } from "@stats/stats.service";
import {
  WeeklyStatsController,
  MonthlyStatsController,
  StatisticsController,
  RegularMonthlyAverageController,
  CategoryStatsController,
  DailyStatsController,
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
    DailyStatsController,
  ],
  providers: [StatsService, SessionAuthGuard],
})
export class StatsModule {}
