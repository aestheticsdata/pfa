import type { InvoiceHolder } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { INVOICE_HOLDER } from "@contexts/receipt-reading/domain/invoice-holder";
import { ReceiptHolders } from "@contexts/receipt-reading/domain/ports/receipt-holders";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

/** The `invoicefile` columns of spendings, exceptionals and recurrings (PFA-274). */
@Injectable()
export class PrismaReceiptHolders extends ReceiptHolders {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async receiptsOf(spendingIds: string[], ownerId: string): Promise<(string | null)[] | null> {
    const ids = [...new Set(spendingIds)];
    const rows = await this.prisma.spendings.findMany({
      where: { userID: ownerId, ID: { in: ids } },
      select: { invoicefile: true },
    });
    return rows.length === ids.length ? rows.map((row) => row.invoicefile) : null;
  }

  async attach(spendingIds: string[], ownerId: string, file: string | null): Promise<void> {
    await this.prisma.spendings.updateMany({
      where: { userID: ownerId, ID: { in: spendingIds } },
      data: { invoicefile: file },
    });
  }

  async fileOf(holder: InvoiceHolder): Promise<string | null> {
    const where = { ID: holder.id, userID: holder.ownerId };
    const select = { invoicefile: true };
    switch (holder.kind.toLowerCase()) {
      case INVOICE_HOLDER.spending:
        return (await this.prisma.spendings.findFirst({ where, select }))?.invoicefile ?? null;
      case INVOICE_HOLDER.recurring:
        return (await this.prisma.recurrings.findFirst({ where, select }))?.invoicefile ?? null;
      case INVOICE_HOLDER.exceptional:
        return (await this.prisma.exceptionals.findFirst({ where, select }))?.invoicefile ?? null;
      default:
        return null;
    }
  }

  async replace(holder: InvoiceHolder, file: string): Promise<string | null> {
    const where = { ID: holder.id, userID: holder.ownerId };
    if (holder.kind === INVOICE_HOLDER.spending) {
      const previous = (await this.prisma.spendings.findFirst({ where, select: { invoicefile: true } }))?.invoicefile;
      // Replacing a shared receipt replaces it for every row holding it (PFA-189).
      await this.prisma.spendings.updateMany({
        where: previous ? { userID: holder.ownerId, invoicefile: previous } : where,
        data: { invoicefile: file },
      });
      return previous ?? null;
    }
    if (holder.kind === INVOICE_HOLDER.exceptional) {
      const previous = (await this.prisma.exceptionals.findFirst({ where, select: { invoicefile: true } }))
        ?.invoicefile;
      await this.prisma.exceptionals.updateMany({ where, data: { invoicefile: file } });
      return previous ?? null;
    }
    return null;
  }

  async clear(holder: InvoiceHolder, file: string): Promise<void> {
    if (holder.kind === INVOICE_HOLDER.spending) {
      // A shared receipt is one receipt: deleting it from one spending deletes it from every
      // spending (and group line) holding it (PFA-189).
      await this.prisma.spendings.updateMany({
        where: { userID: holder.ownerId, invoicefile: file },
        data: { invoicefile: null },
      });
    } else if (holder.kind === INVOICE_HOLDER.exceptional) {
      await this.prisma.exceptionals.updateMany({
        where: { ID: holder.id, userID: holder.ownerId },
        data: { invoicefile: null },
      });
    }
  }
}
