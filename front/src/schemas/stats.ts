import { z } from "zod";

const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

const statisticsMonthEntrySchema = z.record(z.string(), z.union([z.string(), z.number()]));

export const StatisticsResponseSchema = z.object({
  colors: z.record(z.string(), z.string()),
  data: z.record(z.string(), z.array(statisticsMonthEntrySchema)),
});

export type StatisticsResponse = z.infer<typeof StatisticsResponseSchema>;

export const ChartsCategorySchema = z.object({
  category: z.string().nullable(),
  categoryColor: z.string().nullable(),
  value: z.preprocess(
    (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
    z.coerce.number().finite(),
  ),
});

export type ChartsCategory = z.infer<typeof ChartsCategorySchema>;
export const ChartsCategoryListSchema = z.array(ChartsCategorySchema);

// Per-day spending totals for a year (COS-45) — GET /daily-stats. Sparse: one
// entry per day that has at least one spending. Feeds the daily heatmap and the
// day-of-week averages (COS-48).
export const DailyStatSchema = z.object({
  date: z.string(),
  total: numberLikeSchema,
  count: numberLikeSchema,
});

export type DailyStat = z.infer<typeof DailyStatSchema>;

export const DailyStatsResponseSchema = z.object({
  days: z.array(DailyStatSchema),
});

export type DailyStatsResponse = z.infer<typeof DailyStatsResponseSchema>;

// Biggest single one-off (non-exceptional) expense of a year (COS-46) — GET
// /biggest-regular-expense. `expense` is null when the user has no spending that
// year. Backs the "courante" row of the "Plus grosse dépense" KPI card.
export const BiggestRegularExpenseSchema = z.object({
  label: z.string(),
  amount: numberLikeSchema,
  date: z.string(),
  categoryName: z.string().nullable(),
  categoryColor: z.string().nullable(),
});

export type BiggestRegularExpense = z.infer<typeof BiggestRegularExpenseSchema>;

export const BiggestRegularExpenseResponseSchema = z.object({
  expense: BiggestRegularExpenseSchema.nullable(),
});

export type BiggestRegularExpenseResponse = z.infer<typeof BiggestRegularExpenseResponseSchema>;
