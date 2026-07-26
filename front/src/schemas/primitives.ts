import { z } from "zod";

// Shared zod primitives for API response parsing (COS-107).
//
// Money fields come off Prisma as `Decimal`, which NestJS serialises three
// different ways depending on the endpoint (raw Decimal → string, `String()`,
// or `Number()`). Rather than guess per endpoint, every amount-ish field is
// parsed through `numberLikeSchema`, which accepts either shape and always
// yields a finite number.

/** Coerces a string-or-number backend field (Prisma Decimal serialises as either) into a finite number. */
export const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

/**
 * Same coercion, but treats a missing value (null/undefined) or an empty string
 * as 0 instead of failing — for fields the user may never have filled in
 * (dashboard `initialAmount` / `initialCeiling`).
 */
export const numberLikeWithZeroFallbackSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "string" && value.trim() === "") {
    return 0;
  }
  return value;
}, z.coerce.number().finite());

/**
 * Discriminator carried by every spending-like row. The column is a plain
 * `VARCHAR(11)` with no DB constraint, but each table only ever stores its own
 * lowercase literal — every write in the backend (and in the retired Express
 * API before it) emits one of these three, and no read path rewrites the value.
 */
export const itemTypeSchema = z.enum(["spending", "exceptional", "recurring"]);
