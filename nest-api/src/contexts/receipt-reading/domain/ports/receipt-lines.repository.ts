import type {
  OwnedSpending,
  ReceiptLine,
  ReceiptOwner,
  ResolvedReceipt,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/** The saved lines of a spending's receipt (PFA-214), replaced as a set. */
export abstract class ReceiptLinesRepository {
  abstract spending(target: OwnedSpending): Promise<ReceiptOwner | null>;
  abstract lines(spendingId: string): Promise<ReceiptLine[]>;
  /** Replaces the lines (and the store, unless absent) and settles any bulk-read proposal. */
  abstract replace(target: OwnedSpending, receipt: ResolvedReceipt): Promise<void>;
}
