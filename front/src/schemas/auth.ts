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
