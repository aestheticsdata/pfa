import { z } from "zod";
import { FIELD_LIMITS, SECRET_RULES } from "#app/config/field-limits.js";

const email = z.email().max(FIELD_LIMITS.email);
const newPassword = z.string().min(SECRET_RULES.passwordMin).max(SECRET_RULES.max);
/** Free-form, as its owner chooses it: only not blank. */
const passphrase = z
  .string()
  .max(SECRET_RULES.max)
  .refine((value) => value.trim().length > 0, { message: "Required" });

/** Sign-in bounds the address but not the secret: a rule only applies to a secret being chosen. */
export const signInSchema = z.object({ email, password: z.string().min(1).max(SECRET_RULES.max) });

export const setupSchema = z.object({ email, password: newPassword, recoveryPassphrase: passphrase });

export const recoverSchema = z.object({
  email,
  recoveryPassphrase: z.string().min(1).max(SECRET_RULES.max),
  newPassword,
});
