/**
 * The two halves of a month's total spend (GET /monthlystats?from=…): one-off
 * spendings on one side, that month's fixed expenses (recurrings) on the other.
 * The front adds them up for the dashboard's "spent this month" figure and for
 * the remaining-budget delta against `initialAmount`.
 *
 * Both sums are rounded to the cent — summing Prisma `Decimal`s through
 * `Number()` otherwise leaks float noise. They were shipped as `{ amount }`
 * wrappers until COS-179; the envelopes carried nothing.
 *
 * @example { spendingsSum: 842.17, recurringsSum: 1250 }
 */
export interface MonthlyStatsResponse {
  /** Sum of the month's one-off spendings, 0 when there are none. */
  spendingsSum: number;
  /** Sum of the month's fixed expenses, 0 when there are none. */
  recurringsSum: number;
}
