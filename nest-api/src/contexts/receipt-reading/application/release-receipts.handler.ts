import { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import type { ReceiptsLetGo } from "@contexts/spending/domain/interfaces/spendingTypes";
import { Injectable } from "@nestjs/common";

/**
 * Receipt reading's reaction to the Spending context's events (PFA-278): a deleted spending, a
 * dropped group line or a merge may leave a receipt file nobody holds. The file store keeps any
 * file another row — spending, exceptional or recurring — still references, so handling an event
 * twice is harmless.
 */
@Injectable()
export class ReleaseReceiptsHandler {
  constructor(private readonly files: ReceiptFileStore) {}

  handle(event: ReceiptsLetGo): Promise<void> {
    return this.files.release(event.ownerId, event.receipts);
  }
}
