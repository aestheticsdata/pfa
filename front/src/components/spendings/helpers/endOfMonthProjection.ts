import getDate from "date-fns/getDate";
import getDaysInMonth from "date-fns/getDaysInMonth";
import isBefore from "date-fns/isBefore";
import isSameMonth from "date-fns/isSameMonth";
import startOfMonth from "date-fns/startOfMonth";

import type { CategoryDailyTotals, DailyProjection } from "@src/schemas/dashboard";

/** One month's amounts day by day, index i = day (i+1). */
export type DailyAmounts = readonly number[];

export interface MonthProjection {
  /** The month's projected end-of-month total, or null when there is none to show. */
  total: number | null;
  /**
   * What each category still has coming before the month is out, keyed by
   * `categoryKey` — a category with nothing more expected is absent rather than
   * zero. Empty whenever there is no projection to make.
   */
  remainders: Map<string | null, number>;
}

/**
 * The key categories join on: the reference month, the viewed month's own
 * spendings and the breakdown's rows all reduce to it.
 *
 * Case-folded, since the three come from different queries. Uncategorized is
 * `null` rather than a label — the displayed one is translated, so it would
 * stop matching the moment the locale changes.
 */
export const categoryKey = (category: string | null | undefined): string | null => category?.toLowerCase() ?? null;

const round2 = (amount: number): number => Number(amount.toFixed(2));

/**
 * The reference month's spending for one day of the current month. A reference
 * month shorter than the current one carries its last day's value forward, so
 * the two always line up day for day — the rule the sparkline draws with, kept
 * here so the drawn tail and the summed figure can never diverge.
 */
export const referenceDayAmount = (referenceDaily: DailyAmounts, day: number): number =>
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
  referenceDaily: DailyAmounts,
  dailyActuals: DailyAmounts,
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
 * What every category still has coming, read off the reference month (PFA-181).
 *
 * All of them are cut from the SAME month — the chain (N-1 → N-2 → M-1) is
 * resolved once, globally, and only its result is sliced — so the categories
 * stay comparable with one another and with the month as a whole.
 *
 * The booked-ahead clamp applies *within* a category, not across the day's
 * total: a bill pre-paid under one category says nothing about what another is
 * still going to cost, and letting the one cancel the other's estimate silently
 * under-projected the month.
 */
export const projectedRemaindersByCategory = ({
  byCategory,
  actualsByCategory,
  today,
  daysInMonth,
}: {
  /** The reference month, sliced per category. */
  byCategory: readonly CategoryDailyTotals[];
  /** The viewed month's own spendings, per category and per day. */
  actualsByCategory: ReadonlyMap<string | null, DailyAmounts>;
  /** Today's day of the month. */
  today: number;
  /** Days in the viewed month. */
  daysInMonth: number;
}): Map<string | null, number> => {
  const remainders = new Map<string | null, number>();
  for (const slice of byCategory) {
    const key = categoryKey(slice.category);
    const booked = actualsByCategory.get(key) ?? [];
    const remainder = projectedRemainder(slice.dailyTotals, booked, today, daysInMonth);
    // Nothing more expected is an absent entry, not a zero: the breakdown reads
    // this to decide whether a row has a figure worth showing at all.
    if (remainder > 0) remainders.set(key, (remainders.get(key) ?? 0) + remainder);
  }
  return remainders;
};

/** The viewed month's spendings day by day, categories merged back together. */
const flattenActuals = (actualsByCategory: ReadonlyMap<string | null, DailyAmounts>, daysInMonth: number): number[] => {
  const flat = new Array<number>(daysInMonth).fill(0);
  for (const daily of actualsByCategory.values()) {
    for (let day = 0; day < daysInMonth; day += 1) flat[day] += daily[day] ?? 0;
  }
  return flat;
};

/**
 * The month's end-of-month total: what has been spent plus what the reference
 * month says is still coming, summed from the per-category remainders so the
 * headline and the breakdown's rows can never drift apart. Fixed charges need
 * no extrapolation — a month's recurrings are known in full from day one and
 * are already inside `monthlyTotal` — so only the variable half is projected,
 * from the reference month's day-by-day shape.
 *
 * A null total means "no projection to show", never zero: a future month has
 * nothing to project, and the current month has no reference when the GLOBAL
 * chain comes back `source: "none"` (the user's very first month of data). A
 * past month is closed, so its "projection" is simply its realized total.
 */
export const endOfMonthProjection = ({
  monthlyTotal,
  actualsByCategory,
  projection,
  monthRef,
  now,
}: {
  /** The viewed month's realized spend (fixed + variable). */
  monthlyTotal: number;
  /** The viewed month's spendings, per category and per day. */
  actualsByCategory: ReadonlyMap<string | null, DailyAmounts>;
  /** Reference-period data from the GLOBAL chain; undefined while it loads. */
  projection: DailyProjection | undefined;
  /** The viewed month. */
  monthRef: Date;
  /** Client-side "now" — the browser's calendar day, never the server's. */
  now: Date;
}): MonthProjection => {
  if (isSameMonth(monthRef, now)) {
    const daysInMonth = getDaysInMonth(monthRef);
    const today = getDate(now);
    // Nothing left to project on the last day — the month is its own total.
    if (today >= daysInMonth) return { total: monthlyTotal, remainders: new Map() };

    const source = projection?.source ?? "none";
    const referenceDaily = projection?.dailyTotals ?? [];
    if (source === "none" || referenceDaily.length === 0) return { total: null, remainders: new Map() };

    const byCategory = projection?.byCategory ?? [];
    if (byCategory.length === 0) {
      // An API older than PFA-181 sends the reference month whole and no
      // slices. Project it as a whole rather than not at all: the headline
      // stays honest, and the breakdown simply shows no per-category figure
      // until the API catches up.
      const booked = flattenActuals(actualsByCategory, daysInMonth);
      const total = monthlyTotal + projectedRemainder(referenceDaily, booked, today, daysInMonth);
      return { total: round2(total), remainders: new Map() };
    }

    const remainders = projectedRemaindersByCategory({ byCategory, actualsByCategory, today, daysInMonth });
    let total = monthlyTotal;
    for (const remainder of remainders.values()) total += remainder;
    return { total: round2(total), remainders };
  }

  // A finished month already is its end-of-month figure; a future one has
  // nothing to go on.
  return {
    total: isBefore(startOfMonth(monthRef), startOfMonth(now)) ? monthlyTotal : null,
    remainders: new Map(),
  };
};

/**
 * The budget verdict a projection supports: true when the month is heading over
 * budget. Null when there is nothing to conclude from — no projection, or no
 * budget set for the month — so a card can stay silent rather than guess.
 */
export const projectedOverBudget = (projection: number | null, budget: number): boolean | null =>
  projection === null || budget <= 0 ? null : projection > budget;
