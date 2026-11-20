import { readFile } from "node:fs/promises";
import { Injectable } from "@nestjs/common";
import type { DeleteInvoiceImageDto } from "@spendings/dto/delete-invoice-image.dto";
import type { InvoiceUpload } from "@spendings/interfaces/invoiceUploadTypes";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { PrismaService } from "../../prisma/prisma.service";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * The receipt image of a spending, an exceptional or a recurring: read, replaced, deleted. Moved
 * out of the spendings service by PFA-273; it joins the receipt context next.
 */
@Injectable()
export class InvoiceImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptFiles: ReceiptFilesService,
  ) {}

  async getInvoiceImage(
    spendingID: string,
    userID: string,
    itemType: string,
  ): Promise<{ data: string; contentType: string } | null> {
    const invoicefile = await this.getInvoiceFileName(spendingID, userID, itemType);
    if (!invoicefile) return null;

    const filePath = this.receiptFiles.safePath(userID, invoicefile);
    const imageFile = await readFile(filePath);
    const base64Image = imageFile.toString("base64");
    const ext = (invoicefile.split(".").pop() ?? "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "image/jpeg";
    const data = `data:${contentType};base64,${base64Image}`;

    return { data, contentType };
  }

  private async getInvoiceFileName(spendingID: string, userID: string, itemType: string): Promise<string | null> {
    const normalizedType = itemType.toLowerCase();
    if (normalizedType === "spending") {
      const row = await this.prisma.spendings.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      return row?.invoicefile ?? null;
    }
    if (normalizedType === "recurring") {
      const row = await this.prisma.recurrings.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      return row?.invoicefile ?? null;
    }
    if (normalizedType === "exceptional") {
      const row = await this.prisma.exceptionals.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      return row?.invoicefile ?? null;
    }
    return null;
  }

  async deleteInvoiceImage(
    userID: string,
    { ID: spendingID, itemType, invoicefile }: DeleteInvoiceImageDto,
  ): Promise<{ msg: string }> {
    // Rejects a traversal before anything is touched.
    this.receiptFiles.safePath(userID, invoicefile);

    if (itemType === "spending") {
      // A shared receipt is one receipt: deleting it from one spending deletes
      // it from every spending (and group line) holding it (PFA-189).
      await this.prisma.spendings.updateMany({
        where: { userID, invoicefile },
        data: { invoicefile: null },
      });
    } else if (itemType === "exceptional") {
      await this.prisma.exceptionals.updateMany({
        where: { ID: spendingID, userID },
        data: { invoicefile: null },
      });
    }

    await this.receiptFiles.release(userID, [invoicefile]);

    return { msg: "INVOICE_IMAGE_DELETED" };
  }

  async uploadInvoiceImage(
    userID: string,
    { filepath, filename, spendingID, itemType }: InvoiceUpload,
  ): Promise<{ data: string; contentType: string }> {
    const storedFilename = await this.receiptFiles.store(filepath, filename, userID);

    let previous: string | null = null;
    if (itemType === "spending") {
      const row = await this.prisma.spendings.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      previous = row?.invoicefile ?? null;
      // Replacing a shared receipt replaces it for every row holding it (PFA-189).
      await this.prisma.spendings.updateMany({
        where: previous ? { userID, invoicefile: previous } : { ID: spendingID, userID },
        data: { invoicefile: storedFilename },
      });
    } else if (itemType === "exceptional") {
      const row = await this.prisma.exceptionals.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      previous = row?.invoicefile ?? null;
      await this.prisma.exceptionals.updateMany({
        where: { ID: spendingID, userID },
        data: { invoicefile: storedFilename },
      });
    }

    await this.receiptFiles.release(userID, [previous]);

    const result = await this.getInvoiceImage(spendingID, userID, itemType);
    if (!result) {
      throw new Error("Failed to read uploaded image");
    }
    return result;
  }
}
