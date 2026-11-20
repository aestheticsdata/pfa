/**
 * Lets go of receipt files a change may have orphaned (PFA-273). The receipt context decides: a
 * file still held by any row stays.
 */
export abstract class ReceiptReleaser {
  abstract release(ownerId: string, receipts: (string | null)[]): Promise<void>;
}
