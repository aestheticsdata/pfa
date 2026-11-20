import type { ReceiptUpload } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import { ReceiptHolders } from "@contexts/receipt-reading/domain/ports/receipt-holders";
import { SpendingNotFound } from "@contexts/receipt-reading/domain/receipt-errors";
import { Injectable } from "@nestjs/common";

/**
 * One receipt held by several spendings (PFA-189). Nothing records the share besides the rows
 * pointing at the same `invoicefile`, so attaching, replacing and detaching are row updates
 * followed by an orphan-file release.
 */
@Injectable()
export class ReceiptAttachmentsService {
  constructor(
    private readonly holders: ReceiptHolders,
    private readonly files: ReceiptFileStore,
  ) {}

  private async receiptsOf(spendingIds: string[], ownerId: string): Promise<(string | null)[]> {
    const receipts = await this.holders.receiptsOf(spendingIds, ownerId);
    if (!receipts) throw new SpendingNotFound();
    return receipts;
  }

  /** One upload attached to every given spending, replacing what they held. */
  async share(upload: ReceiptUpload, spendingIds: string[], ownerId: string): Promise<{ invoicefile: string }> {
    const previous = await this.receiptsOf(spendingIds, ownerId);
    const invoicefile = await this.files.keep(upload, ownerId);
    await this.holders.attach(spendingIds, ownerId, invoicefile);
    await this.files.release(ownerId, previous);
    return { invoicefile };
  }

  /** The given spendings drop their receipt; the others sharing it keep it. */
  async detach(spendingIds: string[], ownerId: string): Promise<{ success: boolean }> {
    const previous = await this.receiptsOf(spendingIds, ownerId);
    await this.holders.attach(spendingIds, ownerId, null);
    await this.files.release(ownerId, previous);
    return { success: true };
  }
}
