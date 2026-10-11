import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { ReceiptOcrService } from "@spendings/receipt-lines/receipt-ocr.service";
import { parseReceiptPages, pickProposal } from "@spendings/receipt-lines/receipt-text-parser";
import type { ReceiptLine, ReceiptProposal } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
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

  async read(spendingID: string, userID: string): Promise<{ lines: ReceiptLine[] }> {
    await this.ownedSpending(spendingID, userID);
    const rows = await this.prisma.receiptLines.findMany({
      where: { spendingID },
      orderBy: { position: "asc" },
      select: { label: true, amount: true },
    });
    return { lines: rows.map((row) => ({ label: row.label, amount: Number(row.amount) })) };
  }

  async save(spendingID: string, userID: string, lines: ReceiptLine[]): Promise<{ lines: ReceiptLine[] }> {
    await this.ownedSpending(spendingID, userID);
    const accepted = lines.map((line) => ({ label: line.label.trim(), amount: line.amount }));
    await this.prisma.$transaction([
      this.prisma.receiptLines.deleteMany({ where: { spendingID } }),
      this.prisma.receiptLines.createMany({
        data: accepted.map((line, position) => ({ ID: randomUUID(), spendingID, position, ...line })),
      }),
    ]);
    return { lines: accepted };
  }

  /** Reads the spending's receipt; nothing is stored until the user saves. */
  async propose(spendingID: string, userID: string): Promise<ReceiptProposal> {
    const { invoicefile } = await this.ownedSpending(spendingID, userID);
    if (!invoicefile) {
      throw new BadRequestException("NO_RECEIPT");
    }
    const readings = await this.ocr.read(this.receiptFiles.safePath(userID, invoicefile));
    return pickProposal(readings.map(parseReceiptPages));
  }
}
