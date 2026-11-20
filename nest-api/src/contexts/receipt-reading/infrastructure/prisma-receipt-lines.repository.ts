import { randomUUID } from "node:crypto";
import type {
  OwnedSpending,
  ReceiptLine,
  ReceiptOwner,
  ResolvedReceipt,
  SizeUnit,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ReceiptLinesRepository } from "@contexts/receipt-reading/domain/ports/receipt-lines.repository";
import { SIZE_UNIT } from "@contexts/receipt-reading/domain/size-units";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

const SIZE_UNITS = new Set<string>(Object.values(SIZE_UNIT));
const isSizeUnit = (unit: string | null): unit is SizeUnit => unit !== null && SIZE_UNITS.has(unit);

@Injectable()
export class PrismaReceiptLinesRepository extends ReceiptLinesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async spending(target: OwnedSpending): Promise<ReceiptOwner | null> {
    const row = await this.prisma.spendings.findFirst({
      where: { ID: target.spendingId, userID: target.ownerId },
      select: { invoicefile: true, store: { select: { name: true, address: true } } },
    });
    return row && { receipt: row.invoicefile, store: row.store };
  }

  async lines(spendingId: string): Promise<ReceiptLine[]> {
    const rows = await this.prisma.receiptLines.findMany({
      where: { spendingID: spendingId },
      orderBy: { position: "asc" },
      select: {
        label: true,
        amount: true,
        quantity: true,
        size: true,
        sizeUnit: true,
        productType: { select: { name: true } },
      },
    });
    return rows.map((row) => ({
      label: row.label,
      amount: Number(row.amount),
      quantity: Number(row.quantity),
      size: row.size === null ? null : Number(row.size),
      sizeUnit: isSizeUnit(row.sizeUnit) ? row.sizeUnit : null,
      productType: row.productType?.name ?? null,
    }));
  }

  async replace(target: OwnedSpending, receipt: ResolvedReceipt): Promise<void> {
    const { spendingId, ownerId } = target;
    await this.prisma.$transaction([
      // Saved lines settle a bulk-read proposal (PFA-223).
      this.prisma.receiptProposals.deleteMany({ where: { spendingID: spendingId } }),
      this.prisma.receiptLines.deleteMany({ where: { spendingID: spendingId } }),
      this.prisma.receiptLines.createMany({
        data: receipt.lines.map((line, position) => ({
          ID: randomUUID(),
          spendingID: spendingId,
          position,
          label: line.label.trim(),
          amount: line.amount,
          quantity: line.quantity,
          size: line.size,
          sizeUnit: line.size === null ? null : line.sizeUnit,
          productTypeID: line.productTypeId,
        })),
      }),
      ...(receipt.storeId === undefined
        ? []
        : [
            this.prisma.spendings.updateMany({
              where: { ID: spendingId, userID: ownerId },
              data: { storeID: receipt.storeId },
            }),
          ]),
    ]);
  }
}
