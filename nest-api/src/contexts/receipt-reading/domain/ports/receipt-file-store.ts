import type { ReceiptFile, ReceiptUpload } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/**
 * Where receipt images are kept (PFA-274): a file name stored in `invoicefile`, which several rows
 * may hold. A file is only removed once no row references it any more.
 */
export abstract class ReceiptFileStore {
  /** Validates and keeps an upload; the stored file's name. */
  abstract keep(upload: ReceiptUpload, ownerId: string): Promise<string>;
  /** Removes each file no row holds any more. */
  abstract release(ownerId: string, files: (string | null | undefined)[]): Promise<void>;
  abstract open(receipt: ReceiptFile): Promise<Buffer>;
  /** Refuses a name reaching outside the user's own folder, before anything is touched. */
  abstract check(receipt: ReceiptFile): void;
}
