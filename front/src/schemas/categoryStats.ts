import { apiObject } from "@src/schemas/apiObject";
import { numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

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
