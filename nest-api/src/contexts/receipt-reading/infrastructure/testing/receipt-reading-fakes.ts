import type {
  OwnedSpending,
  PendingProposal,
  ProposalStatus,
  QueuedReceiptState,
  ReceiptFile,
  ReceiptLine,
  ReceiptOwner,
  ResolvedReceipt,
  StoreIdentity,
  TypedLines,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ProductTypeCatalog } from "@contexts/receipt-reading/domain/ports/product-type-catalog";
import { QueuedReceiptRepository } from "@contexts/receipt-reading/domain/ports/queued-receipt.repository";
import { ReceiptLinesRepository } from "@contexts/receipt-reading/domain/ports/receipt-lines.repository";
import { ReceiptTextReader } from "@contexts/receipt-reading/domain/ports/receipt-text-reader";
import { StoreDirectory } from "@contexts/receipt-reading/domain/ports/store-directory";
import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { QueuedReceipt } from "@contexts/receipt-reading/domain/queued-receipt";

/**
 * Driven adapters for unit tests (PFA-274): the receipt use cases run against them with no OCR,
 * no disk and no database. The fake reader is what makes the OCR swappable visible.
 */
export class FakeReceiptTextReader extends ReceiptTextReader {
  readonly reads: ReceiptFile[] = [];

  constructor(private readonly readings: string[][]) {
    super();
  }

  async read(receipt: ReceiptFile): Promise<string[][]> {
    this.reads.push(receipt);
    return this.readings;
  }
}

export class InMemoryReceiptLinesRepository extends ReceiptLinesRepository {
  readonly replaced: ResolvedReceipt[] = [];

  constructor(
    private readonly owner: ReceiptOwner | null,
    private readonly saved: ReceiptLine[] = [],
  ) {
    super();
  }

  async spending(_target: OwnedSpending): Promise<ReceiptOwner | null> {
    return this.owner;
  }

  async lines(): Promise<ReceiptLine[]> {
    return this.saved;
  }

  async replace(_target: OwnedSpending, receipt: ResolvedReceipt): Promise<void> {
    this.replaced.push(receipt);
  }
}

/** Every store read is the user's known shop; resolving one gives "store-1". */
export class FakeStoreDirectory extends StoreDirectory {
  readonly resolved: StoreIdentity[] = [];

  constructor(private readonly known: StoreIdentity) {
    super();
  }

  async recognise(read: StoreIdentity | null): Promise<StoreIdentity | null> {
    return read && this.known;
  }

  async resolve(store: StoreIdentity): Promise<string> {
    this.resolved.push(store);
    return "store-1";
  }
}

/** A product type is its name upper-cased; linking types every line as `typed`. */
export class FakeProductTypeCatalog extends ProductTypeCatalog {
  constructor(private readonly typed: string | null = null) {
    super();
  }

  async idsFor(lines: ReceiptLine[]): Promise<(string | null)[]> {
    return lines.map((line) => (line.productType ? `type:${line.productType.toUpperCase()}` : null));
  }

  async link(typed: TypedLines): Promise<ReceiptLine[]> {
    return typed.lines.map((line) => ({ ...line, productType: this.typed }));
  }
}

export class InMemoryQueuedReceiptRepository extends QueuedReceiptRepository {
  readonly rows: QueuedReceiptState[] = [];

  constructor(private readonly ownReceipts: string[]) {
    super();
  }

  async candidates(): Promise<string[]> {
    const queued = new Set(this.rows.map((row) => row.spendingId));
    return this.ownReceipts.filter((id) => !queued.has(id));
  }

  async queue(spendingIds: string[], ownerId: string): Promise<void> {
    for (const spendingId of spendingIds) {
      this.rows.push({ id: `q-${spendingId}`, spendingId, ownerId, status: PROPOSAL_STATUS.queued, proposal: null });
    }
  }

  async countByStatus(): Promise<Map<ProposalStatus, number>> {
    const counts = new Map<ProposalStatus, number>();
    for (const row of this.rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return counts;
  }

  async oldestQueued(): Promise<QueuedReceipt | null> {
    const row = this.rows.find((r) => r.status === PROPOSAL_STATUS.queued);
    return row ? QueuedReceipt.restore({ ...row }) : null;
  }

  async bySpending(spendingId: string): Promise<QueuedReceipt | null> {
    const row = this.rows.find((r) => r.spendingId === spendingId);
    return row ? QueuedReceipt.restore({ ...row }) : null;
  }

  async save(entry: QueuedReceipt): Promise<void> {
    const row = this.rows.find((r) => r.id === entry.id);
    if (row) Object.assign(row, { status: entry.status, proposal: entry.proposal });
  }

  async nextReady(): Promise<PendingProposal | null> {
    return null;
  }
}
