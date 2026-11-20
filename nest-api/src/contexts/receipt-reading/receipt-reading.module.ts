import { BulkReceiptReadService } from "@contexts/receipt-reading/application/bulk-receipt-read.service";
import { InvoiceImagesService } from "@contexts/receipt-reading/application/invoice-images.service";
import { ReceiptAttachmentsService } from "@contexts/receipt-reading/application/receipt-attachments.service";
import { ReceiptLinesService } from "@contexts/receipt-reading/application/receipt-lines.service";
import { ProductTypeCatalog } from "@contexts/receipt-reading/domain/ports/product-type-catalog";
import { QueuedReceiptRepository } from "@contexts/receipt-reading/domain/ports/queued-receipt.repository";
import { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import { ReceiptHolders } from "@contexts/receipt-reading/domain/ports/receipt-holders";
import { ReceiptLinesRepository } from "@contexts/receipt-reading/domain/ports/receipt-lines.repository";
import { ReceiptTextReader } from "@contexts/receipt-reading/domain/ports/receipt-text-reader";
import { StoreDirectory } from "@contexts/receipt-reading/domain/ports/store-directory";
import { LocalReceiptFileStore } from "@contexts/receipt-reading/infrastructure/files/local-receipt-file-store";
import { TesseractReceiptTextReader } from "@contexts/receipt-reading/infrastructure/ocr/tesseract-receipt-text-reader";
import {
  ProductTypesServiceCatalog,
  StoresServiceDirectory,
} from "@contexts/receipt-reading/infrastructure/price-comparison-adapters";
import { PrismaQueuedReceiptRepository } from "@contexts/receipt-reading/infrastructure/prisma-queued-receipt.repository";
import { PrismaReceiptHolders } from "@contexts/receipt-reading/infrastructure/prisma-receipt-holders";
import { PrismaReceiptLinesRepository } from "@contexts/receipt-reading/infrastructure/prisma-receipt-lines.repository";
import { ReceiptLinesController } from "@contexts/receipt-reading/interface/receipt-lines.controller";
import { ReceiptProposalsController } from "@contexts/receipt-reading/interface/receipt-proposals.controller";
import { SpendingReceiptsController } from "@contexts/receipt-reading/interface/spending-receipts.controller";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { SpendingsModule } from "@spendings/spendings.module";

/**
 * The receipt reading context (PFA-274): receipt files, the OCR, the saved lines and the bulk
 * read. Its composition root: Tesseract, the disk and MySQL are bound to their ports here only.
 */
@Module({
  imports: [SpendingsModule],
  controllers: [SpendingReceiptsController, ReceiptLinesController, ReceiptProposalsController],
  providers: [
    ReceiptLinesService,
    BulkReceiptReadService,
    ReceiptAttachmentsService,
    InvoiceImagesService,
    SessionAuthGuard,
    LocalReceiptFileStore,
    { provide: ReceiptFileStore, useExisting: LocalReceiptFileStore },
    { provide: ReceiptTextReader, useClass: TesseractReceiptTextReader },
    { provide: ReceiptHolders, useClass: PrismaReceiptHolders },
    { provide: ReceiptLinesRepository, useClass: PrismaReceiptLinesRepository },
    { provide: QueuedReceiptRepository, useClass: PrismaQueuedReceiptRepository },
    { provide: StoreDirectory, useClass: StoresServiceDirectory },
    { provide: ProductTypeCatalog, useClass: ProductTypesServiceCatalog },
  ],
  // The Spending context releases receipts and serves the invoice image routes through these.
  exports: [ReceiptFileStore, InvoiceImagesService],
})
export class ReceiptReadingModule {}
