import { ReceiptReleaser } from "@contexts/spending/domain/ports/receipt-releaser";
import { Injectable } from "@nestjs/common";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";

/** Hands released receipts to the receipt file store, which keeps any file still held (PFA-273). */
@Injectable()
export class ReceiptFilesReleaser extends ReceiptReleaser {
  constructor(private readonly files: ReceiptFilesService) {
    super();
  }

  async release(ownerId: string, receipts: (string | null)[]): Promise<void> {
    await this.files.release(ownerId, receipts);
  }
}
