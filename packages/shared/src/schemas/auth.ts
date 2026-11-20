import { z } from "zod";

// Auth was the last API boundary still crossing into the app on a bare `as`
// cast instead of a parse (COS-109). Shape mirrors the backend's
// `SignInResponse & { csrfToken }` — returned identically by POST /users
// (login), POST /users/add (signup) and GET /users/me (session bootstrap).
//
// Deliberately a plain `z.object`, never `.strict()`: zod strips unknown keys by
// default, so a field added server-side stays backward-compatible. A strict
// schema would turn any such addition into a hard login failure.

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  // Nullable in DB (`Users.language`, defaulted to "en" but never NOT NULL).
  baseCurrency: z.string(),
  language: z.string().nullable(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  csrfToken: z.string(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** GET /users/csrf — the session's current CSRF token, fetched again after a 403 on a write. */
export const CsrfTokenSchema = z.object({ csrfToken: z.string() });

/** POST /users/token (PFA-286): the mobile sign-in. A Bearer token instead of a cookie, no CSRF token. */
export const TokenSignInResponseSchema = z.object({
  user: AuthUserSchema,
  token: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export type TokenSignInResponse = z.infer<typeof TokenSignInResponseSchema>;

export const RevokeTokenResponseSchema = z.object({ ok: z.boolean() });
