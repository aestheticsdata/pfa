import { z } from "zod";

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
