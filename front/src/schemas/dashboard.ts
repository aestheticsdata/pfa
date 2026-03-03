import { z } from "zod";

const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

const numberLikeWithZeroFallbackSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "string" && value.trim() === "") {
    return 0;
  }
  return value;
}, z.coerce.number().finite());

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

export const MonthlyStatsSchema = z.object({
  spendingsSum: z.object({
    amount: numberLikeSchema,
  }),
  recurringsSum: z.object({
    amount: numberLikeSchema,
  }),
});

export type MonthlyStats = z.infer<typeof MonthlyStatsSchema>;

export const WeeklyStatsSchema = z.array(numberLikeSchema);
export type WeeklyStats = z.infer<typeof WeeklyStatsSchema>;
