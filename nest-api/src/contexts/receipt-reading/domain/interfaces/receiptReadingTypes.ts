import type { INVOICE_HOLDER } from "@contexts/receipt-reading/domain/invoice-holder";
import type { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import type { SIZE_UNIT } from "@contexts/receipt-reading/domain/size-units";

/** A store as read on a receipt or confirmed by the user: name and address (PFA-218, PFA-219). */
export interface StoreIdentity {
  name: string;
  address: string | null;
}

export type SizeUnit = (typeof SIZE_UNIT)[keyof typeof SIZE_UNIT];

/** A product's size: 1 L, 250 g, 0.512 kg for a weighed item (PFA-219). */
export interface ItemSize {
  size: number;
  unit: SizeUnit;
}

/**
 * One line of a receipt: what was bought and what it cost (PFA-214), how many
 * of what size, and the generic product it is (PFA-219).
 */
export interface ReceiptLine {
  label: string;
  amount: number;
  quantity: number;
  size: number | null;
  sizeUnit: SizeUnit | null;
  productType: string | null;
}

/** What a quantity line under an item says: "3 x 1,10", "0,512 kg x 3,99 €/kg". */
export interface QuantityDetail {
  quantity: number;
  unitPrice: number;
  /** Set for a weighed item: its weight is its size, its quantity one. */
  weight: ItemSize | null;
}

/**
 * A spending's receipt as saved (PFA-218): its lines and its store's name.
 * On a save, an absent store leaves the spending's store as it is.
 */
export interface SavedReceipt {
  lines: ReceiptLine[];
  store?: StoreIdentity | null;
}

/** What the OCR read on a receipt, for the user to check before saving. */
export interface ReceiptProposal {
  lines: ReceiptLine[];
  /** The receipt's own total when one was found, to compare with the lines' sum. */
  total: number | null;
  /** The store read on the receipt, or the user's known shop it is (PFA-218, PFA-219). */
  store: StoreIdentity | null;
}

/** The bulk read's progress for a user (PFA-223). */
export interface BulkReadStatus {
  /** Receipts not read yet: own receipt, no lines, never queued. */
  candidates: number;
  queued: number;
  ready: number;
  failed: number;
}

/** A read receipt waiting for the user's review, with its spending. */
export interface PendingProposal {
  spendingID: string;
  label: string;
  amount: number;
  date: string;
  proposal: ReceiptProposal;
}

/** A spending with a receipt, as the candidate filter sees it. */
export interface ReceiptHolder {
  ID: string;
  invoicefile: string;
}

/** Where a bulk-read receipt stands (PFA-223). */
export type ProposalStatus = (typeof PROPOSAL_STATUS)[keyof typeof PROPOSAL_STATUS];

export interface QueuedReceiptState {
  id: string;
  spendingId: string;
  ownerId: string;
  status: ProposalStatus;
  proposal: ReceiptProposal | null;
}

/** A receipt image file of a user. */
export interface ReceiptFile {
  ownerId: string;
  file: string;
}

/** An upload multer just wrote to disk, before the store keeps it. */
export interface ReceiptUpload {
  path: string;
  filename: string;
}

/** Which kind of row holds an invoice image, as the routes name it. */
export type InvoiceHolderKind = (typeof INVOICE_HOLDER)[keyof typeof INVOICE_HOLDER];

/** A row holding a receipt image: a spending, an exceptional or a recurring. */
export interface InvoiceHolder {
  ownerId: string;
  id: string;
  kind: string;
}

/** A receipt image read back for the browser. */
export interface ReceiptImage {
  data: string;
  contentType: string;
}

/** What a saved receipt's lines write, product types and store already resolved. */
export interface ResolvedReceipt {
  lines: (ReceiptLine & { productTypeId: string | null })[];
  /** Absent: the spending keeps its store. */
  storeId?: string | null;
}

/** A spending, and whose it is. */
export interface OwnedSpending {
  spendingId: string;
  ownerId: string;
}

/** A spending as receipt reading sees it: its receipt file and the store it was bought at. */
export interface ReceiptOwner {
  receipt: string | null;
  store: StoreIdentity | null;
}

/** Proposed lines to give product types, and whose receipt they are. */
export interface TypedLines {
  lines: ReceiptLine[];
  ownerId: string;
}
