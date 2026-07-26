import { z } from "zod";

import type { SpendingCategoryInputSchema } from "@src/schemas/spendings";
import type { Dictionary } from "@text/index";

export const makeSpendingSchema = (validation: Dictionary["spendings"]["modal"]["validation"]) =>
  z.object({
    spendingLabel: z.string().min(1, validation.labelRequired),
    // Deliberately a string, not a number (COS-109): the field accepts an
    // arithmetic expression ("12+3"), evaluated on submit by @lib/amountExpression.
    spendingAmount: z.string().min(1, validation.amountRequired),
    spendingDate: z.string().optional(),
  });

export type SpendingForm = z.infer<ReturnType<typeof makeSpendingSchema>>;
export type CategoryOption = z.infer<typeof SpendingCategoryInputSchema>;
