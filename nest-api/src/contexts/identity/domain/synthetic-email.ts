/**
 * Synthetic users (PFA-122): the accounts the bot runner signs up live on a
 * reserved domain. `.test` is reserved by RFC 2606 — no real mailbox can exist
 * there, so no real person can end up flagged, and the flag can only come from
 * this domain.
 */
export const SYNTHETIC_EMAIL_DOMAIN = "synthetic.test";

/** Exact domain only: `bot@synthetic.test`, not `bot@x.synthetic.test` nor `bot@notsynthetic.test`. */
export function isSyntheticEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0) {
    return false;
  }
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domain === SYNTHETIC_EMAIL_DOMAIN;
}

/**
 * The accounts `synthetic:purge` may delete: flagged AND on the reserved
 * domain, so a stray flag on a real account can never get it purged.
 */
export const SYNTHETIC_ACCOUNTS_WHERE = {
  isSynthetic: true,
  email: { endsWith: `@${SYNTHETIC_EMAIL_DOMAIN}` },
} as const;
