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

/** Today most of the time, sometimes a day or two late (entered after the fact). */
export function plausibleDate(today: Date, rng: Rng): string {
  const daysBack = rng.chance(0.8) ? 0 : rng.int(1, SPENDING_BOUNDS.maxDaysBack);
  const date = new Date(today);
  date.setDate(date.getDate() - daysBack);
  return isoDay(date);
}

/** `yyyy-MM-dd` in the server's local time. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
