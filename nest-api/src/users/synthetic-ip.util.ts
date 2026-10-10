/**
 * Synthetic users (PFA-122): bot accounts may only be used from the bot runner's host (ks-b).
 * The allowlist comes from `SYNTHETIC_ALLOWED_IPS`, comma-separated. Fail closed: no allowlist
 * means no address is allowed, so a misconfigured server refuses bots rather than trusting anyone.
 */

/** Express reports IPv4 clients of a dual-stack socket as `::ffff:1.2.3.4`. */
function normalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  return trimmed.startsWith("::ffff:") && trimmed.includes(".") ? trimmed.slice("::ffff:".length) : trimmed;
}

export function isSyntheticIpAllowed(ip: string | undefined, allowlist: string | undefined): boolean {
  if (!ip || !allowlist) {
    return false;
  }
  const client = normalizeIp(ip);
  return allowlist
    .split(",")
    .map(normalizeIp)
    .some((allowed) => allowed !== "" && allowed === client);
}
