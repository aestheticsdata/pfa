import type { Prisma } from "../../../generated/prisma/client";

/** A recurring as GET /recurrings returns it (PFA-257): the fields the front reads, nothing more. */
export interface RecurringItem {
  ID: string;
  dateFrom: Date;
  dateTo: Date;
  itemType: string;
  label: string;
  amount: Prisma.Decimal;
  currency: string | null;
  /** The recurring's receipt, when one was attached from its row (PFA-254). */
  invoicefile: string | null;
  categoryID: string | null;
  category: string | null;
  categoryColor: string | null;
}
