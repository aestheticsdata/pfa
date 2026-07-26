import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { z } from "zod";

import type { Dictionary } from "@text/index";

export const makeExceptionalSchema = (
  errors: Dictionary["exceptionals"]["modal"]["errors"],
  common: Dictionary["common"]["validation"],
) =>
  z.object({
    label: z.string().min(1, errors.labelRequired).max(FIELD_LIMITS.label, common.tooLong(FIELD_LIMITS.label)),
    // As in the spending modal, a string on purpose: it holds a Mexp expression,
    // evaluated on submit by @lib/amountExpression (COS-109).
    amount: z.string().min(1, errors.amountRequired),
    date: z.string().min(1, errors.dateRequired),
    description: z.string().max(FIELD_LIMITS.description, common.tooLong(FIELD_LIMITS.description)).optional(),
  });

export type ExceptionalForm = z.infer<ReturnType<typeof makeExceptionalSchema>>;
