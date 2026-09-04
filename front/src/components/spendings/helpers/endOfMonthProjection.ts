import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isBefore from "date-fns/isBefore";
import isSameMonth from "date-fns/isSameMonth";
import startOfMonth from "date-fns/startOfMonth";

import type { DailyProjection } from "@src/schemas/dashboard";

/**
 * The reference month's spending for one day of the current month. A reference
 * month shorter than the current one carries its last day's value forward, so
 * the two always line up day for day — the rule the sparkline draws with, kept
 * here so the drawn tail and the summed figure can never diverge.
 */
export const referenceDayAmount = (referenceDaily: readonly number[], day: number): number =>
  referenceDaily[day - 1] ?? referenceDaily[referenceDaily.length - 1] ?? 0;

/**
 * What the reference month suggests is *still to come* over the days left.
 *
 * A day is estimated from the reference, except where the current month already
 * carries a booked entry for it: a spending can be dated ahead (a bill paid in
 * advance, a booked trip), and that euro is already inside the realized total.
 * Taking the greater of the two keeps a known charge from being replaced by a
 * smaller estimate without ever counting it twice — this returns only the
 * *excess* of the estimate over what is already booked.
 */
export const projectedRemainder = (
  referenceDaily: readonly number[],
  dailyActuals: readonly number[],
  today: number,
  daysInMonth: number,
): number => {
  let remainder = 0;
  for (let day = today + 1; day <= daysInMonth; day += 1) {
    const booked = dailyActuals[day - 1] ?? 0;
    remainder += Math.max(0, referenceDayAmount(referenceDaily, day) - booked);
  }
  return remainder;
};

/**
 * The month's end-of-month total: what has been spent plus what the reference
 * month says is still coming. Fixed charges need no extrapolation — a month's
 * recurrings are known in full from day one and are already inside
 * `monthlyTotal` — so only the variable half is projected, from the reference
 * month's day-by-day shape.
 *
 * Null means "no projection to show", never zero: a future month has nothing to
 * project, and the current month has no reference when the GLOBAL chain comes
 * back `source: "none"` (the user's very first month of data). A past month is
 * closed, so its "projection" is simply its realized total.
 */
export const endOfMonthProjection = ({
  monthlyTotal,
  dailyActuals,
  projection,
  monthRef,
  now,
}: {
  /** The viewed month's realized spend (fixed + variable). */
  monthlyTotal: number;
  /** The viewed month's spendings per day, index i = day (i+1). */
  dailyActuals: readonly number[];
  /** Reference-period data from the GLOBAL chain; undefined while it loads. */
  projection: DailyProjection | undefined;
  /** The viewed month. */
  monthRef: Date;
  /** Client-side "now" — the browser's calendar day, never the server's. */
  now: Date;
}): number | null => {
  if (isSameMonth(monthRef, now)) {
    const daysInMonth = getDaysInMonth(monthRef);
    const today = getDate(now);
    // Nothing left to project on the last day — the month is its own total.
    if (today >= daysInMonth) return monthlyTotal;

    const source = projection?.source ?? "none";
    const referenceDaily = projection?.dailyTotals ?? [];
    if (source === "none" || referenceDaily.length === 0) return null;

    const total = monthlyTotal + projectedRemainder(referenceDaily, dailyActuals, today, daysInMonth);
    return Number(total.toFixed(2));
  }

  // A finished month already is its end-of-month figure; a future one has
  // nothing to go on.
  return isBefore(startOfMonth(monthRef), startOfMonth(now)) ? monthlyTotal : null;
};

/**
 * The budget verdict a projection supports: true when the month is heading over
 * budget. Null when there is nothing to conclude from — no projection, or no
 * budget set for the month — so a card can stay silent rather than guess.
 */
export const projectedOverBudget = (projection: number | null, budget: number): boolean | null =>
  projection === null || budget <= 0 ? null : projection > budget;
