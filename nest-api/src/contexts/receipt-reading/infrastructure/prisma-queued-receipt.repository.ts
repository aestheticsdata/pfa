import { randomUUID } from "node:crypto";
import { ownReceipts } from "@contexts/receipt-reading/domain/bulk-candidates";
import type {
  PendingProposal,
  ProposalStatus,
  ReceiptProposal,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { QueuedReceiptRepository } from "@contexts/receipt-reading/domain/ports/queued-receipt.repository";
import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { QueuedReceipt } from "@contexts/receipt-reading/domain/queued-receipt";
import { PrismaService } from "@db/prisma.service";
import type { Prisma } from "@generated/prisma/client";
import { Injectable } from "@nestjs/common";
import { format } from "date-fns";

type ProposalRow = Prisma.ReceiptProposalsGetPayload<object>;

const STATUSES = new Set<string>(Object.values(PROPOSAL_STATUS));
const asStatus = (status: string) => (STATUSES.has(status) ? (status as ProposalStatus) : PROPOSAL_STATUS.failed);

/** The `ReceiptProposals` table (PFA-223): one row per receipt in the bulk read. */
@Injectable()
export class PrismaQueuedReceiptRepository extends QueuedReceiptRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async candidates(ownerId: string): Promise<string[]> {
    const [spendings, files] = await Promise.all([
      this.prisma.spendings.findMany({
        where: {
          userID: ownerId,
          invoicefile: { not: null },
          groupID: null,
          receiptLines: { none: {} },
          receiptProposal: null,
        },
        select: { ID: true, invoicefile: true },
      }),
      this.prisma.spendings.groupBy({
        by: ["invoicefile"],
        where: { userID: ownerId, invoicefile: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const holders = new Map(files.map((file) => [file.invoicefile ?? "", file._count._all]));
    return ownReceipts(
      spendings.map((spending) => ({ ID: spending.ID, invoicefile: spending.invoicefile ?? "" })),
      holders,
    );
  }

  async queue(spendingIds: string[], ownerId: string): Promise<void> {
    await this.prisma.receiptProposals.createMany({
      data: spendingIds.map((spendingID) => ({
        ID: randomUUID(),
        spendingID,
        userID: ownerId,
        status: PROPOSAL_STATUS.queued,
      })),
      skipDuplicates: true,
    });
  }

  async countByStatus(ownerId: string): Promise<Map<ProposalStatus, number>> {
    const counts = await this.prisma.receiptProposals.groupBy({
      by: ["status"],
      where: { userID: ownerId },
      _count: { _all: true },
    });
    return new Map(counts.map((row) => [asStatus(row.status), row._count._all]));
  }

  async oldestQueued(ownerId: string): Promise<QueuedReceipt | null> {
    return this.restore(
      await this.prisma.receiptProposals.findFirst({
        where: { userID: ownerId, status: PROPOSAL_STATUS.queued },
        orderBy: { createdAt: "asc" },
      }),
    );
  }

  async bySpending(spendingId: string, ownerId: string): Promise<QueuedReceipt | null> {
    return this.restore(
      await this.prisma.receiptProposals.findFirst({ where: { spendingID: spendingId, userID: ownerId } }),
    );
  }

  async save(entry: QueuedReceipt): Promise<void> {
    await this.prisma.receiptProposals.update({
      where: { ID: entry.id },
      data: {
        status: entry.status,
        ...(entry.proposal ? { proposal: entry.proposal as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async nextReady(ownerId: string): Promise<PendingProposal | null> {
    const row = await this.prisma.receiptProposals.findFirst({
      where: { userID: ownerId, status: PROPOSAL_STATUS.ready },
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

  private restore(row: ProposalRow | null): QueuedReceipt | null {
    if (!row) return null;
    return QueuedReceipt.restore({
      id: row.ID,
      spendingId: row.spendingID,
      ownerId: row.userID,
      status: asStatus(row.status),
      proposal: row.proposal as unknown as ReceiptProposal | null,
    });
  }
}
