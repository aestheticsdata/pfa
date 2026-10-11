/** A dated amount as Prisma returns it (`amount` is a Decimal). */
export interface DatedAmount {
  date: Date;
  amount: { toString: () => string };
}

/** One calendar-aligned week slice of a month, as inclusive day-of-month bounds. */
export interface WeekRange {
  startDay: number;
  endDay: number;
}

/** A half-open UTC date range, ready for a Prisma `date` filter. */
export interface DateWindow {
  gte?: Date;
  lt?: Date;
}
