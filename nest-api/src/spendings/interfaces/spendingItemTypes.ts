import type { Prisma } from "../../../generated/prisma/client";

/**
 * A spending row as GET /spendings and the search return it (PFA-257): exactly the fields the
 * front reads, so a new column reaches no response until it is added here and to the `select`.
 */
export interface SpendingItem {
  ID: string;
  date: Date;
  itemType: string;
  label: string;
  amount: Prisma.Decimal;
  currency: string | null;
  invoicefile: string | null;
  categoryID: string | null;
  category: string | null;
  categoryColor: string | null;
  /** A line of a group (PFA-189); null on a plain spending. */
  groupID: string | null;
  detail: string | null;
  /** Where it was bought, when its receipt named the store (PFA-218). */
  storeID: string | null;
  storeName: string | null;
  /** How many receipt lines were saved for the row (PFA-214). */
  lineCount: number;
}

/** GET /spendings also joins the group's name, so the front can fold its lines (PFA-189). */
export interface SpendingListItem extends SpendingItem {
  groupLabel: string | null;
}

/** One keyset page of the whole-history search (COS-114); `total` on the first page only. */
export interface SpendingSearchPage {
  items: SpendingItem[];
  nextCursor: string | null;
  total?: number;
}
