import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { z } from "zod";

import type { Dictionary } from "@text/index";

export const makeLoginSchema = (
  needEmail: boolean,
  needPassword: boolean,
  needConfirm: boolean,
  needCurrency: boolean,
  validation: Dictionary["login"]["validation"],
  common: Dictionary["common"]["validation"],
) =>
  z
    .object({
      // A hidden field validates as a plain `z.string()`, never `.optional()`:
      // the form's `defaultValues` always supplies "" for it, so the value is
      // present either way. Keeping it required is what makes `z.infer` resolve
      // to all required strings instead of collapsing every field to
      // `string | undefined` — the root cause of the `values.email!` assertions
      // in the callers (COS-109).
      email: needEmail
        ? z
            .string()
            .min(1, validation.emailRequired)
            .email(validation.emailInvalid)
            .max(FIELD_LIMITS.email, common.tooLong(FIELD_LIMITS.email))
        : z.string(),
      password: needPassword ? z.string().min(1, validation.passwordRequired) : z.string(),
      confirmPassword: needConfirm ? z.string().min(1, validation.confirmRequired) : z.string(),
      currency: needCurrency ? z.string().min(1) : z.string(),
    })
    .refine((d) => !needConfirm || d.password === d.confirmPassword, {
      message: validation.passwordMismatch,
      path: ["confirmPassword"],
    });

export type LoginForm = z.infer<ReturnType<typeof makeLoginSchema>>;
