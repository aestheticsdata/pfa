import { Module } from "@nestjs/common";
import { DashboardController } from "@dashboard/dashboard.controller";
import { DashboardService } from "@dashboard/dashboard.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, SessionAuthGuard],
})
export class DashboardModule {}
