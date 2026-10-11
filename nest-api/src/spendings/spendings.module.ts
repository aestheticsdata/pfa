import { Module } from "@nestjs/common";
import { SpendingsController } from "@spendings/spendings.controller";
import { SpendingsService } from "@spendings/spendings.service";
import { SpendingGroupsController } from "@spendings/groups/spending-groups.controller";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";
import { SpendingReceiptsController } from "@spendings/receipts/spending-receipts.controller";
import { SpendingReceiptsService } from "@spendings/receipts/spending-receipts.service";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { ReceiptLinesController } from "@spendings/receipt-lines/receipt-lines.controller";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";
import { ReceiptOcrService } from "@spendings/receipt-lines/receipt-ocr.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { MonitoringModule } from "@monitoring/monitoring.module";

@Module({
  imports: [MonitoringModule],
  controllers: [SpendingsController, SpendingGroupsController, SpendingReceiptsController, ReceiptLinesController],
  providers: [
    SpendingsService,
    SpendingGroupsService,
    SpendingReceiptsService,
    ReceiptFilesService,
    ReceiptLinesService,
    ReceiptOcrService,
    SessionAuthGuard,
  ],
})
export class SpendingsModule {}
