import spendings from "@text/spendings";
import { z } from "zod";

import type { SpendingCategoryInputSchema } from "@src/schemas/spendings";

export const spendingSchema = z.object({
  spendingLabel: z.string().min(1, spendings.modal.validation.labelRequired),
  spendingAmount: z.string().min(1, spendings.modal.validation.amountRequired),
  spendingDate: z.string().optional(),
  categoryName: z.string().optional(),
});

export type SpendingForm = z.infer<typeof spendingSchema>;
export type CategoryOption = z.infer<typeof SpendingCategoryInputSchema>;
