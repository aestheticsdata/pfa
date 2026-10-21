import { DashboardController } from "@dashboard/dashboard.controller";
import { DashboardService } from "@dashboard/dashboard.service";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, SessionAuthGuard],
})
export class DashboardModule {}
