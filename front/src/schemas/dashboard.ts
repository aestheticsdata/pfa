import { numberLikeSchema, numberLikeWithZeroFallbackSchema } from "@src/schemas/primitives";
import { z } from "zod";

export const DashboardSchema = z.object({
  ID: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  initialAmount: numberLikeWithZeroFallbackSchema,
  initialCeiling: numberLikeWithZeroFallbackSchema,
  userID: z.string(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;

export const DashboardResponseSchema = DashboardSchema.nullable();

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

// Sparkline projection reference data (COS-27). `source` names which historical
// period the projected tail is based on (GLOBAL chain N-1 → N-2 → M-1), or
// "none" at the user's very first month of data → no tail. `dailyTotals` are the
// reference month's day-by-day spending totals, index i = day (i+1).
export const ProjectionSourceSchema = z.enum(["sameMonthLastYear", "sameMonthTwoYearsAgo", "previousMonth", "none"]);

export type ProjectionSource = z.infer<typeof ProjectionSourceSchema>;

export const DailyProjectionSchema = z.object({
  source: ProjectionSourceSchema,
  referenceMonth: z.string().nullable(),
  dailyTotals: z.array(numberLikeSchema),
});

export type DailyProjection = z.infer<typeof DailyProjectionSchema>;

// Per-month income (dashboard initialAmount) for a year (COS-50) — GET
// /dashboard/monthly-income. 12-slot Jan→Dec; null where the user has no
// dashboard row for that month. Backs the monthly chart's stepped budget line.
export const MonthlyIncomeResponseSchema = z.object({
  income: z.array(z.number().finite().nullable()),
});

export type MonthlyIncomeResponse = z.infer<typeof MonthlyIncomeResponseSchema>;

export const MonthlyStatsSchema = z.object({
  spendingsSum: z.object({
    amount: numberLikeSchema,
  }),
  recurringsSum: z.object({
    amount: numberLikeSchema,
  }),
});

export const WeeklyStatsSchema = z.array(numberLikeSchema);
