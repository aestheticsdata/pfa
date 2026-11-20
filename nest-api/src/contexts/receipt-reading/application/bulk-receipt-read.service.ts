import { ReceiptLinesService } from "@contexts/receipt-reading/application/receipt-lines.service";
import type { BulkReadStatus, PendingProposal } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { QueuedReceiptRepository } from "@contexts/receipt-reading/domain/ports/queued-receipt.repository";
import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { Injectable, Logger } from "@nestjs/common";

/**
 * Reading the user's saved receipts in one go (PFA-223). Each receipt goes through the same OCR
 * queue as a single read — one at a time, the API never starved — and its result waits as a
 * proposal until the user saves or skips it.
 */
@Injectable()
export class BulkReceiptReadService {
  private readonly logger = new Logger(BulkReceiptReadService.name);
  /** Users whose queue is being read right now: one reader per user. */
  private readonly reading = new Set<string>();

  constructor(
    private readonly queue: QueuedReceiptRepository,
    private readonly receiptLines: ReceiptLinesService,
  ) {}

  async status(ownerId: string): Promise<BulkReadStatus> {
    const [candidates, counts] = await Promise.all([this.queue.candidates(ownerId), this.queue.countByStatus(ownerId)]);
    const status = {
      candidates: candidates.length,
      queued: counts.get(PROPOSAL_STATUS.queued) ?? 0,
      ready: counts.get(PROPOSAL_STATUS.ready) ?? 0,
      failed: counts.get(PROPOSAL_STATUS.failed) ?? 0,
    };
    // A restart drops the reader: whoever asks for the progress picks it up again.
    if (status.queued > 0) this.read(ownerId);
    return status;
  }

  /** Queues every candidate receipt and starts reading them. */
  async start(ownerId: string): Promise<BulkReadStatus> {
    const spendingIds = await this.queue.candidates(ownerId);
    if (spendingIds.length > 0) await this.queue.queue(spendingIds, ownerId);
    return this.status(ownerId);
  }

  next(ownerId: string): Promise<PendingProposal | null> {
    return this.queue.nextReady(ownerId);
  }

  /** The user passed on this receipt: it leaves the queue and is not read again. */
  async skip(spendingId: string, ownerId: string): Promise<BulkReadStatus> {
    const entry = await this.queue.bySpending(spendingId, ownerId);
    if (entry) {
      entry.skip();
      await this.queue.save(entry);
    }
    return this.status(ownerId);
  }

  /** Reads the user's queued receipts one after the other, in the background. */
  private read(ownerId: string): void {
    if (this.reading.has(ownerId)) return;
    this.reading.add(ownerId);
    void this.drain(ownerId).finally(() => this.reading.delete(ownerId));
  }

  private async drain(ownerId: string): Promise<void> {
    for (;;) {
      const entry = await this.queue.oldestQueued(ownerId);
      if (!entry) return;
      try {
        entry.markReady(await this.receiptLines.propose({ spendingId: entry.spendingId, ownerId }));
      } catch (err) {
        this.logger.warn(`Bulk receipt read failed for ${entry.spendingId}: ${(err as Error).message}`);
        entry.markFailed();
      }
      await this.queue.save(entry);
    }
  }
}
