import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { z } from "zod";

import type { LoginFieldsShown } from "@components/shared/interfaces/sharedLoginFormTypes";
import type { Dictionary } from "@text/interfaces/textTypes";

export const makeLoginSchema = (
  shown: LoginFieldsShown,
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
      email: shown.email
        ? z
            .string()
            .min(1, validation.emailRequired)
            .email(validation.emailInvalid)
            .max(FIELD_LIMITS.email, common.tooLong(FIELD_LIMITS.email))
        : z.string(),
      password: shown.password ? z.string().min(1, validation.passwordRequired) : z.string(),
      confirmPassword: shown.confirm ? z.string().min(1, validation.confirmRequired) : z.string(),
      currency: shown.currency ? z.string().min(1) : z.string(),
    })
    .refine((d) => !shown.confirm || d.password === d.confirmPassword, {
      message: validation.passwordMismatch,
      path: ["confirmPassword"],
    });

export type LoginForm = z.infer<ReturnType<typeof makeLoginSchema>>;
