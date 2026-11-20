import type { PendingProposal, ProposalStatus } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import type { QueuedReceipt } from "@contexts/receipt-reading/domain/queued-receipt";

/** The bulk read's queue (PFA-223). */
export abstract class QueuedReceiptRepository {
  /** The owner's spendings whose own receipt was never read nor queued. */
  abstract candidates(ownerId: string): Promise<string[]>;
  abstract queue(spendingIds: string[], ownerId: string): Promise<void>;
  abstract countByStatus(ownerId: string): Promise<Map<ProposalStatus, number>>;
  abstract oldestQueued(ownerId: string): Promise<QueuedReceipt | null>;
  abstract bySpending(spendingId: string, ownerId: string): Promise<QueuedReceipt | null>;
  abstract save(entry: QueuedReceipt): Promise<void>;
  /** The next read receipt to review, newest spending first. */
  abstract nextReady(ownerId: string): Promise<PendingProposal | null>;
}
