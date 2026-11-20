import type { Prisma } from "@generated/prisma/client";
import { CalendarDay } from "@shared-kernel/calendar-day";
import { Money } from "@shared-kernel/money";

/** A legacy row stored without a currency: "" in the domain, null again in the table. */
const NO_CURRENCY = "";

/** What a spending row is in the domain's terms (PFA-273): the table keeps its own shape. */
export const toMoney = (amount: Prisma.Decimal, currency: string | null) =>
  Money.of(amount.toString(), currency ?? NO_CURRENCY);

export const currencyColumn = (money: Money) => (money.currency === NO_CURRENCY ? null : money.currency);

export const toDay = (date: Date) => CalendarDay.fromDate(date);

/** Every write of a spending row says what it is: the column predates the groups. */
export const SPENDING_ITEM_TYPE = "spending";
