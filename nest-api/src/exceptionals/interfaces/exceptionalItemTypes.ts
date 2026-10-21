import type { Prisma } from "../../../generated/prisma/client";

/** An exceptional expense as GET /exceptionals returns it (PFA-257). */
export interface ExceptionalItem {
  ID: string;
  date: Date;
  itemType: string;
  label: string;
  description: string | null;
  amount: Prisma.Decimal;
  currency: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  invoicefile: string | null;
}
