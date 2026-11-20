import { z } from "zod";

/**
 * The one switch between strict and tolerant API responses (PFA-177).
 *
 * Outside production a response object rejects unknown keys, so a field added by the api fails
 * loudly in dev and in the contract tests instead of being stripped in silence. In production it
 * keeps zod's default stripping: an addition server-side must never break the UI.
 *
 * Response schemas only — request payloads stay plain `z.object`, and so does
 * `AuthResponseSchema` (see `schemas/auth.ts`).
 */
const STRICT = process.env.NODE_ENV !== "production";

export const apiObject = <Shape extends z.ZodRawShape>(shape: Shape) => {
  const tolerant = z.object(shape);
  // Same shape, same output type: only the unknown-key policy differs.
  return STRICT ? (z.strictObject(shape) as unknown as typeof tolerant) : tolerant;
};
