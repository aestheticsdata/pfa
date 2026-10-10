import { zonedDay } from "@core/time/zonedTime";

import type { Rng } from "@core/random/rng";

/** Hard bounds every bot spending respects, whatever its catalog says. */
export const SPENDING_BOUNDS = {
  minAmount: 0.5,
  maxAmount: 300,
  /** A spending is dated today, or entered late — up to this many days back. */
  maxDaysBack: 2,
} as const;

export function clampAmount(amount: number): number {
  const bounded = Math.min(SPENDING_BOUNDS.maxAmount, Math.max(SPENDING_BOUNDS.minAmount, amount));
  return Math.round(bounded * 100) / 100;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Today most of the time, sometimes a day or two late (entered after the fact) — "today" being the
 * bot's day in its own time zone, not ks-b's UTC one.
 */
export function plausibleDate(today: Date, rng: Rng, timeZone: string): string {
  const daysBack = rng.chance(0.8) ? 0 : rng.int(1, SPENDING_BOUNDS.maxDaysBack);
  return zonedDay(new Date(today.getTime() - daysBack * DAY_MS), timeZone);
}
