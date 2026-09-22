import {
  categoryKey,
  endOfMonthProjection,
  projectedOverBudget,
  referenceDayAmount,
} from "@components/spendings/helpers/endOfMonthProjection";

import type { CategoryDailyTotals, DailyProjection } from "@src/schemas/dashboard";

// September 2026 = 30 days, March = 31, February = 28, January = 31.
const SEPT_4 = new Date(2026, 8, 4);
const flat = (days: number, amount: number): number[] => new Array(days).fill(amount);

/** The category the single-category fixtures below spend under. */
const GROCERIES = "groceries";

const slice = (category: string | null, dailyTotals: number[]): CategoryDailyTotals => ({
  category,
  categoryColor: null,
  dailyTotals,
});

/** The viewed month's own spendings, keyed the way the helper joins on. */
const actuals = (entries: [string | null, number[]][]): Map<string | null, number[]> =>
  new Map(entries.map(([category, daily]) => [categoryKey(category), daily]));

/** A reference month. Unless sliced explicitly, it all sits under one category,
 *  which makes the figure identical to projecting the month as a whole. */
const reference = (dailyTotals: number[], byCategory?: CategoryDailyTotals[]): DailyProjection => ({
  source: "sameMonthLastYear",
  referenceMonth: "2025-09-01",
  dailyTotals,
  byCategory: byCategory ?? (dailyTotals.length > 0 ? [slice(GROCERIES, dailyTotals)] : []),
});

/** A day-length array carrying one amount on one day. */
const onDay = (days: number, day: number, amount: number): number[] => {
  const daily = flat(days, 0);
  daily[day - 1] = amount;
  return daily;
};

describe("endOfMonthProjection", () => {
  it("does not extrapolate the month's fixed charges", () => {
    // Day 4 of 30, with the month's fixed charges (1600) already fully debited
    // and 150 of variable spending on top. The reference month spends a flat
    // 50/day, so the 26 days left are worth 1300.
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      actualsByCategory: actuals([[GROCERIES, [40, 30, 50, 30]]]),
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.total).toBe(3050);
    // The pre-PFA-175 model — (1750 / 4) × 30 — multiplied the fixed charges by
    // the days left and landed at 13125.
    expect(result.total).toBeLessThan(13125);
  });

  it("projects nothing when the chain has no reference period", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      actualsByCategory: actuals([[GROCERIES, [1750]]]),
      projection: { source: "none", referenceMonth: null, dailyTotals: [], byCategory: [] },
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.total).toBeNull();
    expect(result.remainders.size).toBe(0);
  });

  it("projects nothing while the reference is still loading", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      actualsByCategory: actuals([[GROCERIES, [1750]]]),
      projection: undefined,
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.total).toBeNull();
  });

  it("projects nothing when a source is named but carries no days", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      actualsByCategory: actuals([[GROCERIES, [1750]]]),
      projection: reference([]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.total).toBeNull();
  });

  it("returns the realized total on the month's last day", () => {
    const lastDay = new Date(2026, 8, 30);
    const result = endOfMonthProjection({
      monthlyTotal: 2400,
      actualsByCategory: actuals([[GROCERIES, flat(30, 80)]]),
      projection: reference(flat(30, 50)),
      monthRef: lastDay,
      now: lastDay,
    });
    expect(result.total).toBe(2400);
    expect(result.remainders.size).toBe(0);
  });

  it("returns the realized total for a finished month", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 2400,
      actualsByCategory: actuals([[GROCERIES, flat(31, 80)]]),
      projection: undefined,
      monthRef: new Date(2026, 7, 15),
      now: SEPT_4,
    });
    expect(result.total).toBe(2400);
    expect(result.remainders.size).toBe(0);
  });

  it("projects nothing for a month that has not started", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1600,
      actualsByCategory: new Map(),
      projection: undefined,
      monthRef: new Date(2026, 9, 15),
      now: SEPT_4,
    });
    expect(result.total).toBeNull();
  });

  it("carries the reference month's last day forward when it is shorter", () => {
    // March (31 days) projected from February (28): days 29, 30 and 31 have no
    // counterpart and repeat February 28th.
    const february = [...flat(27, 10), 100];
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      actualsByCategory: new Map(),
      projection: reference(february),
      monthRef: new Date(2026, 2, 27),
      now: new Date(2026, 2, 27),
    });
    expect(result.total).toBe(400); // day 28 (100) + days 29–31 carrying it forward
  });

  it("carries the last day forward per category, not just for the month", () => {
    // Same short-February case, split over two categories: each one repeats its
    // OWN last day, so the slices still add up to the month's figure.
    const february = [...flat(27, 10), 100];
    const rent = [...flat(27, 0), 60];
    const food = [...flat(27, 10), 40];
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      actualsByCategory: new Map(),
      projection: reference(february, [slice("rent", rent), slice("food", food)]),
      monthRef: new Date(2026, 2, 27),
      now: new Date(2026, 2, 27),
    });
    expect(result.remainders.get("rent")).toBe(240); // 60 on day 28, repeated over 29–31
    expect(result.remainders.get("food")).toBe(160); // 40 on day 28, repeated over 29–31
    expect(result.total).toBe(400);
  });

  it("ignores the reference month's overhanging days when it is longer", () => {
    // February (28 days) projected from January (31): only day 28 is left, and
    // January's days 29–31 are never read.
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      actualsByCategory: new Map(),
      projection: reference(flat(31, 10)),
      monthRef: new Date(2026, 1, 27),
      now: new Date(2026, 1, 27),
    });
    expect(result.total).toBe(10);
  });

  it("never counts a spending dated ahead twice", () => {
    // A 200 entry booked on the 20th is already inside monthlyTotal. Estimating
    // that day from the reference on top of it would inflate the figure.
    const dailyActuals = flat(30, 0);
    dailyActuals[0] = 40;
    dailyActuals[19] = 200;
    const result = endOfMonthProjection({
      monthlyTotal: 1840, // 1600 fixed + 40 spent + the 200 booked ahead
      actualsByCategory: actuals([[GROCERIES, dailyActuals]]),
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // 25 estimated days at 50, and nothing added for the 20th.
    expect(result.total).toBe(1840 + 1250);
  });

  it("tops a booked day up to the reference when the estimate is the larger of the two", () => {
    const dailyActuals = flat(30, 0);
    dailyActuals[0] = 40;
    dailyActuals[19] = 20; // day 20 already carries 20, the reference expects 50
    const result = endOfMonthProjection({
      monthlyTotal: 1660,
      actualsByCategory: actuals([[GROCERIES, dailyActuals]]),
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // 25 full days at 50, plus the 30 still expected on the 20th.
    expect(result.total).toBe(1660 + 1250 + 30);
  });

  it("no longer lets one category's pre-paid bill cancel another's estimate", () => {
    // The reference month expects 30 of leisure on the 25th; this month already
    // carries an unrelated 50 of transport booked on that same day.
    const leisure = onDay(30, 25, 30);
    const transport = onDay(30, 25, 50);
    const result = endOfMonthProjection({
      monthlyTotal: 50,
      actualsByCategory: actuals([["transport", transport]]),
      projection: reference(leisure, [slice("leisure", leisure)]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // Clamping on the day's total made this 0 — a transport charge silently
    // swallowed a leisure estimate. Per category, the 30 survives.
    expect(result.remainders.get("leisure")).toBe(30);
    expect(result.total).toBe(80);
  });

  it("expects nothing more from a category the reference month never saw", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 120,
      actualsByCategory: actuals([["gifts", onDay(30, 2, 120)]]),
      projection: reference(flat(30, 10), [slice(GROCERIES, flat(30, 10))]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // No reference slice, so no estimate — never an average fallback.
    expect(result.remainders.has("gifts")).toBe(false);
    expect(result.remainders.get(GROCERIES)).toBe(260); // 26 days left at 10
  });

  it("still expects a category that has had no spending yet this month", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      actualsByCategory: new Map(),
      projection: reference(onDay(30, 25, 80), [slice("insurance", onDay(30, 25, 80))]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.remainders.get("insurance")).toBe(80);
    expect(result.total).toBe(80);
  });

  it("keeps a category with nothing more coming out of the remainders", () => {
    // The reference month's spending all sits before today, so there is nothing
    // left to expect — an absent entry, not a zero.
    const result = endOfMonthProjection({
      monthlyTotal: 60,
      actualsByCategory: actuals([[GROCERIES, onDay(30, 1, 60)]]),
      projection: reference(onDay(30, 2, 45)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.remainders.size).toBe(0);
    expect(result.total).toBe(60);
  });

  it("joins the reference and the month's spendings whatever their casing", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 50,
      actualsByCategory: actuals([["Groceries", onDay(30, 20, 50)]]),
      projection: reference(flat(30, 20), [slice("groceries", flat(30, 20))]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // Day 20 is already booked past the reference's 20, so only the other 25
    // days left are expected — proof the two sides matched.
    expect(result.total).toBe(50 + 500);
  });

  it("sums exactly to the total it reports", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 300,
      actualsByCategory: actuals([["food", onDay(30, 3, 300)]]),
      projection: reference(flat(30, 30), [
        slice("food", flat(30, 20)),
        slice("transport", flat(30, 7)),
        slice(null, flat(30, 3)),
      ]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    const summed = [...result.remainders.values()].reduce((accumulator, value) => accumulator + value, 300);
    expect(result.total).toBe(summed);
    expect(result.remainders.get(null)).toBe(78); // uncategorized keeps its own slice
  });

  it("projects the month as a whole when the API sends no per-category slices", () => {
    // An API older than PFA-181: the headline has to stay right even though no
    // row can show a figure.
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      actualsByCategory: actuals([[GROCERIES, [40, 30, 50, 30]]]),
      projection: {
        source: "sameMonthLastYear",
        referenceMonth: "2025-09-01",
        dailyTotals: flat(30, 50),
        byCategory: [],
      },
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result.total).toBe(3050);
    expect(result.remainders.size).toBe(0);
  });
});

describe("categoryKey", () => {
  it("folds case so the three sources join", () => {
    expect(categoryKey("Groceries")).toBe("groceries");
  });

  it("keys uncategorized as null rather than a translated label", () => {
    expect(categoryKey(null)).toBeNull();
    expect(categoryKey(undefined)).toBeNull();
  });
});

describe("referenceDayAmount", () => {
  it("keeps a genuine zero rather than carrying the last day forward", () => {
    expect(referenceDayAmount([10, 0, 30], 2)).toBe(0);
  });

  it("falls back to zero when there is no reference at all", () => {
    expect(referenceDayAmount([], 5)).toBe(0);
  });
});

describe("projectedOverBudget", () => {
  it("has no verdict without a projection", () => {
    expect(projectedOverBudget(null, 3500)).toBeNull();
  });

  it("has no verdict when no budget is set for the month", () => {
    expect(projectedOverBudget(3050, 0)).toBeNull();
  });

  it("compares the projection against the budget", () => {
    expect(projectedOverBudget(3600, 3500)).toBe(true);
    expect(projectedOverBudget(3050, 3500)).toBe(false);
  });
});
