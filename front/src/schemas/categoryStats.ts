import { numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

export const CategoryStatSchema = z.object({
  categoryID: z.string(),
  count: numberLikeSchema,
  total: numberLikeSchema,
});

export type CategoryStat = z.infer<typeof CategoryStatSchema>;

export const CategoryStatsResponseSchema = z.object({
  totalSpent: numberLikeSchema,
  byCategory: z.array(CategoryStatSchema),
});
