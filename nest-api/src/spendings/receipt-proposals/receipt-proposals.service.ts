import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { format } from "date-fns";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";
import { ownReceipts } from "@spendings/receipt-proposals/bulk-candidates";
import { PROPOSAL_STATUS } from "@spendings/receipt-proposals/proposal-status";
import type { ReceiptProposal } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import type { BulkReadStatus, PendingProposal } from "@spendings/receipt-proposals/interfaces/receiptProposalsTypes";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Reading the user's saved receipts in one go (PFA-223). Each receipt goes
 * through the same OCR queue as a single read — one at a time, the API never
 * starved — and its result waits as a proposal until the user saves or skips it.
 */
@Injectable()
export class ReceiptProposalsService {
  private readonly logger = new Logger(ReceiptProposalsService.name);
  /** Users whose queue is being read right now: one reader per user. */
  private readonly reading = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptLines: ReceiptLinesService,
  ) {}

  /** The spendings whose own receipt was never read nor queued. */
  private async candidates(userID: string): Promise<string[]> {
    const [spendings, files] = await Promise.all([
      this.prisma.spendings.findMany({
        where: {
          userID,
          invoicefile: { not: null },
          groupID: null,
          receiptLines: { none: {} },
          receiptProposal: null,
        },
        select: { ID: true, invoicefile: true },
      }),
      this.prisma.spendings.groupBy({
        by: ["invoicefile"],
        where: { userID, invoicefile: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const holders = new Map(files.map((file) => [file.invoicefile ?? "", file._count._all]));
    return ownReceipts(
      spendings.map((spending) => ({ ID: spending.ID, invoicefile: spending.invoicefile ?? "" })),
      holders,
    );
  }

  async status(userID: string): Promise<BulkReadStatus> {
    const [candidates, counts] = await Promise.all([
      this.candidates(userID),
      this.prisma.receiptProposals.groupBy({ by: ["status"], where: { userID }, _count: { _all: true } }),
    ]);
    const count = (status: string) => counts.find((row) => row.status === status)?._count._all ?? 0;
    const status = {
      candidates: candidates.length,
      queued: count(PROPOSAL_STATUS.queued),
      ready: count(PROPOSAL_STATUS.ready),
      failed: count(PROPOSAL_STATUS.failed),
    };
    // A restart drops the reader: whoever asks for the progress picks it up again.
    if (status.queued > 0) this.read(userID);
    return status;
  }

  /** Queues every candidate receipt and starts reading them. */
  async start(userID: string): Promise<BulkReadStatus> {
    const spendingIDs = await this.candidates(userID);
    if (spendingIDs.length > 0) {
      await this.prisma.receiptProposals.createMany({
        data: spendingIDs.map((spendingID) => ({
          ID: randomUUID(),
          spendingID,
          userID,
          status: PROPOSAL_STATUS.queued,
        })),
        skipDuplicates: true,
      });
    }
    return this.status(userID);
  }

  /** The next read receipt to review, newest spending first, or null. */
  async next(userID: string): Promise<PendingProposal | null> {
    const row = await this.prisma.receiptProposals.findFirst({
      where: { userID, status: PROPOSAL_STATUS.ready },
      orderBy: { spending: { date: "desc" } },
      select: {
        spendingID: true,
        proposal: true,
        spending: { select: { label: true, amount: true, date: true } },
      },
    });
    if (!row) return null;
    return {
      spendingID: row.spendingID,
      label: row.spending.label,
      amount: Number(row.spending.amount),
      date: format(row.spending.date, "yyyy-MM-dd"),
      proposal: row.proposal as unknown as ReceiptProposal,
    };
  }

  /** The user passed on this receipt: it leaves the queue and is not read again. */
  async skip(spendingID: string, userID: string): Promise<BulkReadStatus> {
    await this.prisma.receiptProposals.updateMany({
      where: { spendingID, userID },
      data: { status: PROPOSAL_STATUS.skipped },
    });
    return this.status(userID);
  }

  /** Reads the user's queued receipts one after the other, in the background. */
  private read(userID: string): void {
    if (this.reading.has(userID)) return;
    this.reading.add(userID);
    void this.drain(userID).finally(() => this.reading.delete(userID));
  }

  private async drain(userID: string): Promise<void> {
    for (;;) {
      const queued = await this.prisma.receiptProposals.findFirst({
        where: { userID, status: PROPOSAL_STATUS.queued },
        orderBy: { createdAt: "asc" },
        select: { ID: true, spendingID: true },
      });
      if (!queued) return;
      try {
        const proposal = await this.receiptLines.propose(queued.spendingID, userID);
        await this.prisma.receiptProposals.update({
          where: { ID: queued.ID },
          data: { status: PROPOSAL_STATUS.ready, proposal: proposal as object },
        });
      } catch (err) {
        this.logger.warn(`Bulk receipt read failed for ${queued.spendingID}: ${(err as Error).message}`);
        await this.prisma.receiptProposals.update({
          where: { ID: queued.ID },
          data: { status: PROPOSAL_STATUS.failed },
        });
      }
    }
  }
}
