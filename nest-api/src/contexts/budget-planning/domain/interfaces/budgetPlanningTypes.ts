import type { CATEGORY_CHOICE } from "@contexts/budget-planning/domain/category-choice";
import type { Prisma } from "@generated/prisma/client";

/** A category as GET /categories returns it (PFA-257). */
export interface CategoryItem {
  ID: string;
  userID: string | null;
  name: string;
  color: string;
}

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
/** A month's dashboard as GET /dashboard returns it (PFA-257); amounts as numbers. */
export interface DashboardItem {
  ID: string;
  dateFrom: Date;
  dateTo: Date;
  initialAmount: number;
  initialCeiling: number | null;
}

/** A category picked or typed in a modal, as the front sends it. */
export interface CategoryPick {
  ID?: string | null;
  name?: string;
  color?: string | null;
}

/** A category typed by name in a modal, created on the fly when the user has none by that name. */
export interface TypedCategory {
  name: string;
  color: string;
}

/** What a category pick asks for, before any lookup. */
export type CategoryChoice =
  | { kind: typeof CATEGORY_CHOICE.existing; categoryId: string }
  | { kind: typeof CATEGORY_CHOICE.unchanged; categoryId: string }
  | { kind: typeof CATEGORY_CHOICE.typed; category: TypedCategory }
  | { kind: typeof CATEGORY_CHOICE.none };

/** A category, a recurring, an exceptional, a month's budget: what is acted on, and whose it is. */
export interface OwnedRecord {
  id: string;
  ownerId: string;
}

export interface CategoryEdit {
  name: string;
  color: string;
}

/** A month's recurring charge: one row per month, copied forward (COS-49). */
export interface RecurringCharge {
  label: string;
  amount: number | string;
  itemType: string;
  currency: string | null;
  categoryId: string | null;
}

/** The days a month's rows are dated with. */
export interface MonthSpan {
  start: Date;
  end: Date;
}

/** A half-open UTC range. */
export interface DayRange {
  from: Date;
  until: Date;
}

export interface NewRecurring extends MonthSpan {
  label: string;
  amount: number;
  currency: string | null;
  categoryId: string | null;
}

export interface RecurringEdit {
  label: string;
  amount: number;
  categoryId: string | null;
}

/** An exceptional's category is a frozen copy, not a reference: renaming a category leaves it. */
export interface CategorySnapshot {
  categoryName: string | null;
  categoryColor: string | null;
}

export interface ExceptionalFields extends CategorySnapshot {
  date: Date;
  label: string;
  description: string | null;
  amount: number;
}

export interface NewExceptional extends ExceptionalFields {
  currency: string | null;
}

/** What an edit of the month's budget changes: an absent or null field stays as it is. */
export interface BudgetRevision {
  initialAmount?: number;
  initialCeiling?: number;
}

/** A month's budget row as PUT /dashboard answers it: the whole row, amounts as decimal text. */
export interface StoredMonthlyBudget {
  ID: string;
  dateFrom: Date;
  dateTo: Date;
  initialAmount: string;
  userID: string;
  initialCeiling: string | null;
}

export interface NewMonthlyBudget extends MonthSpan {
  amount: number;
}

/** An edit of the month's budget, as sent. */
export interface BudgetEdit {
  amount?: number | null;
  ceiling?: number | null;
}

/** A closed range of days, both ends included. */
export interface ClosedRange {
  gte: Date;
  lte: Date;
}
