import { z } from "zod";
import { apiObject } from "#schemas/apiObject";
import { numberLikeSchema } from "#schemas/primitives";

export const CategoryStatSchema = apiObject({
  categoryID: z.string(),
  count: numberLikeSchema,
  total: numberLikeSchema,
});

export type CategoryStat = z.infer<typeof CategoryStatSchema>;

export const CategoryStatsResponseSchema = apiObject({
  totalSpent: numberLikeSchema,
  byCategory: z.array(CategoryStatSchema),
});
