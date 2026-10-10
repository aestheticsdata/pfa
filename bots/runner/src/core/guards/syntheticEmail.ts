/**
 * A bot may only ever use an address on its app's reserved synthetic domain (`synthetic.test` for
 * PFA): checked before any HTTP call, so a typo or a bad config can never make the runner sign in
 * as, or sign up over, a real person. Exact domain, case-insensitive — the app applies the same
 * rule when it flags the account (PFA-122).
 */
export function isSyntheticEmail(email: string, domain: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0 || domain === "") {
    return false;
  }
  return (
    email
      .slice(at + 1)
      .trim()
      .toLowerCase() === domain.toLowerCase()
  );
}

export function assertSyntheticEmail(email: string, domain: string): void {
  if (!isSyntheticEmail(email, domain)) {
    throw new Error(`Refusing a non-synthetic address (must be on @${domain})`);
  }
}
