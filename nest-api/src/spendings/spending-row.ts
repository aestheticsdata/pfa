import { accessibleCategory, JOINED_CATEGORY_SELECT } from "@categories/accessible-category";
import type { SpendingItem } from "@spendings/interfaces/spendingItemTypes";
import type { Prisma } from "../../generated/prisma/client";

/**
 * The columns a spending row sends (PFA-257). A `select`, never a spread of the row: a column
 * added to the table stays out of every response until it is listed here.
 */
export const SPENDING_ROW_SELECT = {
  ID: true,
  date: true,
  itemType: true,
  label: true,
  amount: true,
  currency: true,
  invoicefile: true,
  categoryID: true,
  groupID: true,
  detail: true,
  storeID: true,
  category: JOINED_CATEGORY_SELECT,
  store: { select: { name: true } },
  _count: { select: { receiptLines: true } },
} satisfies Prisma.SpendingsSelect;

type SpendingRow = Prisma.SpendingsGetPayload<{ select: typeof SPENDING_ROW_SELECT }>;

/** A selected row in its response shape: the category flattened, the store named, the lines counted. */
export function toSpendingItem(row: SpendingRow, userID: string): SpendingItem {
  return {
    ID: row.ID,
    date: row.date,
    itemType: row.itemType,
    label: row.label,
    amount: row.amount,
    currency: row.currency,
    invoicefile: row.invoicefile,
    categoryID: row.categoryID,
    ...accessibleCategory(row.category, userID),
    groupID: row.groupID,
    detail: row.detail,
    storeID: row.storeID,
    storeName: row.store?.name ?? null,
    lineCount: row._count.receiptLines,
  };
}
