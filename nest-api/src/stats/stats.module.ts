import { Module } from "@nestjs/common";
import { StatsService } from "@stats/stats.service";
import { WeeklyStatsController, MonthlyStatsController } from "@stats/stats.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [WeeklyStatsController, MonthlyStatsController],
  providers: [StatsService],
})
export class StatsModule {}
