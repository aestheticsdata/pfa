import type {
  InvoiceHolder,
  ReceiptImage,
  ReceiptUpload,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import { ReceiptHolders } from "@contexts/receipt-reading/domain/ports/receipt-holders";
import { Injectable } from "@nestjs/common";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** The receipt image of a spending, an exceptional or a recurring: read, replaced, deleted. */
@Injectable()
export class InvoiceImagesService {
  constructor(
    private readonly holders: ReceiptHolders,
    private readonly files: ReceiptFileStore,
  ) {}

  async read(holder: InvoiceHolder): Promise<ReceiptImage | null> {
    const file = await this.holders.fileOf(holder);
    if (!file) return null;

    const image = await this.files.open({ ownerId: holder.ownerId, file });
    const ext = (file.split(".").pop() ?? "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "image/jpeg";
    return { data: `data:${contentType};base64,${image.toString("base64")}`, contentType };
  }

  async replace(holder: InvoiceHolder, upload: ReceiptUpload): Promise<ReceiptImage> {
    const file = await this.files.keep(upload, holder.ownerId);
    const previous = await this.holders.replace(holder, file);
    await this.files.release(holder.ownerId, [previous]);

    const image = await this.read(holder);
    if (!image) throw new Error("Failed to read uploaded image");
    return image;
  }

  async remove(holder: InvoiceHolder, file: string): Promise<{ msg: string }> {
    // Rejects a traversal before anything is touched.
    this.files.check({ ownerId: holder.ownerId, file });
    await this.holders.clear(holder, file);
    await this.files.release(holder.ownerId, [file]);
    return { msg: "INVOICE_IMAGE_DELETED" };
  }
}
