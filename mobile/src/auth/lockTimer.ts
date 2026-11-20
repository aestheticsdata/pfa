/** Settings › Sécurité › Verrouillage auto: immediately, after 1 min (default) or 5 min in background. */
export const AUTO_LOCK_DELAY = {
  immediate: 0,
  oneMinute: 60_000,
  fiveMinutes: 300_000,
} as const;

/**
 * Whether the app must show the lock screen on its way back to the foreground. A missing
 * timestamp (the app never went to the background) never locks; a clock that went backwards
 * (time zone change, manual change) locks, to be safe.
 */
export const shouldLockOnReturn = (backgroundedAt: number | null, now: number, delay: number) => {
  if (backgroundedAt === null) return false;
  const elapsed = now - backgroundedAt;
  return elapsed < 0 || elapsed >= delay;
};
