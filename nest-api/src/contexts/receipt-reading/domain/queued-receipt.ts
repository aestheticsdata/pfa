import type {
  ProposalStatus,
  QueuedReceiptState,
  ReceiptProposal,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { ReceiptNotQueued } from "@contexts/receipt-reading/domain/receipt-errors";
import { AggregateRoot } from "@shared-kernel/aggregate-root";

/**
 * A saved receipt waiting in the bulk read (PFA-223): queued, then read once — ready with what the
 * OCR proposes, or failed — and skipped when the user passes on it. Its proposal is never applied
 * to the spending on its own: saving the lines settles it.
 */
export class QueuedReceipt extends AggregateRoot {
  private constructor(private readonly state: QueuedReceiptState) {
    super();
  }

  static restore(state: QueuedReceiptState): QueuedReceipt {
    return new QueuedReceipt(state);
  }

  get id(): string {
    return this.state.id;
  }

  get spendingId(): string {
    return this.state.spendingId;
  }

  get status(): ProposalStatus {
    return this.state.status;
  }

  get proposal(): ReceiptProposal | null {
    return this.state.proposal;
  }

  markReady(proposal: ReceiptProposal): void {
    this.assertQueued();
    this.state.status = PROPOSAL_STATUS.ready;
    this.state.proposal = proposal;
  }

  markFailed(): void {
    this.assertQueued();
    this.state.status = PROPOSAL_STATUS.failed;
  }

  /** The user passed on it, whatever it stood at: it leaves the queue and is not read again. */
  skip(): void {
    this.state.status = PROPOSAL_STATUS.skipped;
  }

  private assertQueued(): void {
    if (this.state.status !== PROPOSAL_STATUS.queued) throw new ReceiptNotQueued();
  }
}
