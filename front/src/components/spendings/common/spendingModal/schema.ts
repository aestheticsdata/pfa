import { z } from "zod";

import type { SpendingCategoryInputSchema } from "@src/schemas/spendings";

export const spendingSchema = z.object({
  spendingLabel: z.string().min(1, "Label requis"),
  spendingAmount: z.string().min(1, "Montant requis"),
  spendingDate: z.string().optional(),
  categoryName: z.string().optional(),
});

export type SpendingForm = z.infer<typeof spendingSchema>;
export type CategoryOption = z.infer<typeof SpendingCategoryInputSchema>;
