import { MonitoringModule } from "@monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { SpendingGroupsController } from "@spendings/groups/spending-groups.controller";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { PricesController } from "@spendings/prices/prices.controller";
import { PricesService } from "@spendings/prices/prices.service";
import { ProductTypesController } from "@spendings/product-types/product-types.controller";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
import { ReceiptLinesController } from "@spendings/receipt-lines/receipt-lines.controller";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";
import { ReceiptOcrService } from "@spendings/receipt-lines/receipt-ocr.service";
import { ReceiptProposalsController } from "@spendings/receipt-proposals/receipt-proposals.controller";
import { ReceiptProposalsService } from "@spendings/receipt-proposals/receipt-proposals.service";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { SpendingReceiptsController } from "@spendings/receipts/spending-receipts.controller";
import { SpendingReceiptsService } from "@spendings/receipts/spending-receipts.service";
import { SpendingsController } from "@spendings/spendings.controller";
import { SpendingsService } from "@spendings/spendings.service";
import { StoresController } from "@spendings/stores/stores.controller";
import { StoresService } from "@spendings/stores/stores.service";

@Module({
  imports: [MonitoringModule],
  controllers: [
    SpendingsController,
    SpendingGroupsController,
    SpendingReceiptsController,
    ReceiptLinesController,
    StoresController,
    ProductTypesController,
    PricesController,
    ReceiptProposalsController,
  ],
  providers: [
    SpendingsService,
    SpendingGroupsService,
    SpendingReceiptsService,
    ReceiptFilesService,
    ReceiptLinesService,
    ReceiptOcrService,
    StoresService,
    ProductTypesService,
    PricesService,
    ReceiptProposalsService,
    SessionAuthGuard,
  ],
})
export class SpendingsModule {}
