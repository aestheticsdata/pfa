import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { ReceiptOcrService } from "@spendings/receipt-lines/receipt-ocr.service";
import { parseReceiptPages, pickProposal } from "@spendings/receipt-lines/receipt-text-parser";
import { StoresService } from "@spendings/stores/stores.service";
import type { ReceiptProposal, SavedReceipt } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * The line items of a spending's receipt (PFA-214): proposed by the local OCR,
 * saved only once the user accepted them.
 */
@Injectable()
export class ReceiptLinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptFiles: ReceiptFilesService,
    private readonly ocr: ReceiptOcrService,
    private readonly stores: StoresService,
  ) {}

  private async ownedSpending(spendingID: string, userID: string) {
    const spending = await this.prisma.spendings.findFirst({
      where: { ID: spendingID, userID },
      select: { invoicefile: true },
    });
    if (!spending) {
      throw new NotFoundException("Spending not found");
    }
    return spending;
  }

  async read(spendingID: string, userID: string): Promise<SavedReceipt> {
    await this.ownedSpending(spendingID, userID);
    const [rows, spending] = await Promise.all([
      this.prisma.receiptLines.findMany({
        where: { spendingID },
        orderBy: { position: "asc" },
        select: { label: true, amount: true },
      }),
      this.prisma.spendings.findFirst({
        where: { ID: spendingID, userID },
        select: { store: { select: { name: true } } },
      }),
    ]);
    return {
      lines: rows.map((row) => ({ label: row.label, amount: Number(row.amount) })),
      store: spending?.store?.name ?? null,
    };
  }

  async save(spendingID: string, userID: string, receipt: SavedReceipt): Promise<SavedReceipt> {
    await this.ownedSpending(spendingID, userID);
    const accepted = receipt.lines.map((line) => ({ label: line.label.trim(), amount: line.amount }));
    const storeWrite =
      receipt.store === undefined
        ? []
        : [
            this.prisma.spendings.updateMany({
              where: { ID: spendingID, userID },
              data: { storeID: receipt.store ? await this.stores.resolve(receipt.store, userID) : null },
            }),
          ];
    await this.prisma.$transaction([
      this.prisma.receiptLines.deleteMany({ where: { spendingID } }),
      this.prisma.receiptLines.createMany({
        data: accepted.map((line, position) => ({ ID: randomUUID(), spendingID, position, ...line })),
      }),
      ...storeWrite,
    ]);
    return this.read(spendingID, userID);
  }

  /** Reads the spending's receipt; nothing is stored until the user saves. */
  async propose(spendingID: string, userID: string): Promise<ReceiptProposal> {
    const { invoicefile } = await this.ownedSpending(spendingID, userID);
    if (!invoicefile) {
      throw new BadRequestException("NO_RECEIPT");
    }
    const readings = await this.ocr.read(this.receiptFiles.safePath(userID, invoicefile));
    const proposal = pickProposal(readings.map(parseReceiptPages));
    // A name read slightly off comes back as the store the user already has.
    return { ...proposal, store: await this.stores.recognise(proposal.store, userID) };
  }
}
