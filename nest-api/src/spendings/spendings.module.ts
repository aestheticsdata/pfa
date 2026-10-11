import { Module } from "@nestjs/common";
import { SpendingsController } from "@spendings/spendings.controller";
import { SpendingsService } from "@spendings/spendings.service";
import { SpendingGroupsController } from "@spendings/groups/spending-groups.controller";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";
import { SpendingReceiptsController } from "@spendings/receipts/spending-receipts.controller";
import { SpendingReceiptsService } from "@spendings/receipts/spending-receipts.service";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { MonitoringModule } from "@monitoring/monitoring.module";

@Module({
  imports: [MonitoringModule],
  controllers: [SpendingsController, SpendingGroupsController, SpendingReceiptsController],
  providers: [SpendingsService, SpendingGroupsService, SpendingReceiptsService, ReceiptFilesService, SessionAuthGuard],
})
export class SpendingsModule {}
