import { Injectable, NotFoundException } from "@nestjs/common";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * One receipt held by several spendings (PFA-189). Nothing records the share
 * besides the rows pointing at the same `invoicefile`, so attaching, replacing
 * and detaching are plain row updates followed by an orphan-file release.
 */
@Injectable()
export class SpendingReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptFiles: ReceiptFilesService,
  ) {}

  private async ownedInvoiceFiles(spendingIDs: string[], userID: string): Promise<(string | null)[]> {
    const ids = [...new Set(spendingIDs)];
    const rows = await this.prisma.spendings.findMany({
      where: { userID, ID: { in: ids } },
      select: { invoicefile: true },
    });
    if (rows.length !== ids.length) {
      throw new NotFoundException("Spending not found");
    }
    return rows.map((row) => row.invoicefile);
  }

  /** One upload attached to every given spending, replacing what they held. */
  async share(
    upload: { path: string; filename: string },
    spendingIDs: string[],
    userID: string,
  ): Promise<{ invoicefile: string }> {
    const previous = await this.ownedInvoiceFiles(spendingIDs, userID);
    const invoicefile = await this.receiptFiles.store(upload.path, upload.filename, userID);

    await this.prisma.spendings.updateMany({
      where: { userID, ID: { in: spendingIDs } },
      data: { invoicefile },
    });
    await this.receiptFiles.release(userID, previous);

    return { invoicefile };
  }

  /** The given spendings drop their receipt; the others sharing it keep it. */
  async detach(spendingIDs: string[], userID: string): Promise<{ success: boolean }> {
    const previous = await this.ownedInvoiceFiles(spendingIDs, userID);

    await this.prisma.spendings.updateMany({
      where: { userID, ID: { in: spendingIDs } },
      data: { invoicefile: null },
    });
    await this.receiptFiles.release(userID, previous);

    return { success: true };
  }
}
