/** Column widths in `prisma/schema.prisma` the API bounds input to. */
export const FIELD_LIMITS = {
  email: 250,
} as const;

/**
 * The password and the recovery passphrase, chosen at setup (PFA-127 handoff: password ≥ 12,
 * passphrase free-form, only non-empty). `max` is bcrypt's: it hashes the first 72 bytes and ignores the rest, so
 * accepting more would check part of a secret while its owner believes all of it counts. Sign-in
 * bounds neither: a rule only ever applies to a secret being chosen, never to one being proved.
 */
export const SECRET_RULES = {
  passwordMin: 12,
  max: 72,
} as const;

/** Sign-in, counted per address: 10 tries per 15 min (Zeus's numbers). */
export const SIGNIN_RATE_LIMIT = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
} as const;

/** Recovery, counted per email: the passphrase is the one secret worth grinding at. */
export const RECOVERY_RATE_LIMIT = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
} as const;
