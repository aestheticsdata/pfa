import type { z } from "zod";
import type { recoverSchema, setupSchema, signInSchema } from "#app/auth/auth.schemas.js";

export type SignInBody = z.infer<typeof signInSchema>;
export type SetupBody = z.infer<typeof setupSchema>;
export type RecoverBody = z.infer<typeof recoverSchema>;

/** What a signed-in session carries. */
export interface SessionUser {
  id: string;
  email: string;
}

/** The session object, as far as the back-office is concerned. */
export interface BotsSession {
  userId?: string;
  email?: string;
  csrfToken?: string;
}
