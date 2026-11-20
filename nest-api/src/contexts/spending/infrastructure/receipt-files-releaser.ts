import { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import { ReceiptReleaser } from "@contexts/spending/domain/ports/receipt-releaser";
import { Injectable } from "@nestjs/common";

/** Hands released receipts to the receipt context's file store, which keeps any file still held (PFA-273). */
@Injectable()
export class ReceiptFilesReleaser extends ReceiptReleaser {
  constructor(private readonly files: ReceiptFileStore) {
    super();
  }

  async release(ownerId: string, receipts: (string | null)[]): Promise<void> {
    await this.files.release(ownerId, receipts);
  }
}
