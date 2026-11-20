import type {
  ReceiptLine,
  StoreIdentity,
  TypedLines,
} from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";

/** The generic products lines are compared by (PFA-219). Price comparison owns them. */
export abstract class ProductTypeCatalog {
  /** Each line's product type ID, created when new; null for a line with none. */
  abstract idsFor(lines: ReceiptLine[], ownerId: string): Promise<(string | null)[]>;
  /** Proposed lines with the product types their labels were given before. */
  abstract link(typed: TypedLines, store: StoreIdentity | null): Promise<ReceiptLine[]>;
}
