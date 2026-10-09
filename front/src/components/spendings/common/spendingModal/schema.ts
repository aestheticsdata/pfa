import { SPENDING_MODAL_MODE } from "@components/spendings/config/constants";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { z } from "zod";

import type { SpendingModalMode } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SpendingCategoryInputSchema } from "@src/schemas/spendings";
import type { Dictionary } from "@text/index";

export const makeSpendingSchema = (
  validation: Dictionary["spendings"]["modal"]["validation"],
  common: Dictionary["common"]["validation"],
  mode: SpendingModalMode = SPENDING_MODAL_MODE.single,
) => {
  // In group mode the label is the store's name — the lines are "<name> — <detail>",
  // so it is shorter — and the amounts live on the lines (PFA-189).
  const isGroup = mode === SPENDING_MODAL_MODE.group;
  const labelMax = isGroup ? FIELD_LIMITS.groupLabel : FIELD_LIMITS.label;
  return z.object({
    spendingLabel: z.string().min(1, validation.labelRequired).max(labelMax, common.tooLong(labelMax)),
    // Deliberately a string, not a number (COS-109): the field accepts an
    // arithmetic expression ("12+3"), evaluated on submit by @lib/amountExpression.
    spendingAmount: isGroup ? z.string() : z.string().min(1, validation.amountRequired),
    spendingDate: z.string().optional(),
  });
};

export type SpendingForm = z.infer<ReturnType<typeof makeSpendingSchema>>;
export type CategoryOption = z.infer<typeof SpendingCategoryInputSchema>;
