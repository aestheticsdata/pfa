import { ReceiptReleaser } from "@contexts/spending/domain/ports/receipt-releaser";

/** Records what was released (PFA-273). */
export class FakeReceiptReleaser extends ReceiptReleaser {
  readonly released: (string | null)[][] = [];

  async release(_ownerId: string, receipts: (string | null)[]): Promise<void> {
    this.released.push(receipts);
  }
}
