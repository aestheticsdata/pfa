import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";

/**
 * "Maximum daily budget" / "left to spend" — the remaining monthly budget
 * spread over the days left in the month (the reference day included).
 *
 * Single source of truth shared by the Spendings day-card and the Dashboard
 * "Left to spend" insight so the two always show the exact same figure.
 * Rounded to the nearest euro and clamped at 0 (never negative).
 */
export default function dailyRemainingBudget(remaining: number, reference: Date): number {
  const daysLeft = Math.max(1, getDaysInMonth(reference) - getDate(reference) + 1);
  return Math.max(0, Math.round(remaining / daysLeft));
}
