import { z } from "zod";

/** Coerces a string-or-number backend field (Prisma Decimal serialises as either) into a finite number. */
const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

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

export type CategoryStatsResponse = z.infer<typeof CategoryStatsResponseSchema>;
