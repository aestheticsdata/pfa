import {
  endOfMonthProjection,
  projectedOverBudget,
  referenceDayAmount,
} from "@components/spendings/helpers/endOfMonthProjection";

import type { DailyProjection } from "@src/schemas/dashboard";

// September 2026 = 30 days, March = 31, February = 28, January = 31.
const SEPT_4 = new Date(2026, 8, 4);
const flat = (days: number, amount: number): number[] => new Array(days).fill(amount);
const reference = (dailyTotals: number[]): DailyProjection => ({
  source: "sameMonthLastYear",
  referenceMonth: "2025-09-01",
  dailyTotals,
});

describe("endOfMonthProjection", () => {
  it("does not extrapolate the month's fixed charges", () => {
    // Day 4 of 30, with the month's fixed charges (1600) already fully debited
    // and 150 of variable spending on top. The reference month spends a flat
    // 50/day, so the 26 days left are worth 1300.
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      dailyActuals: [40, 30, 50, 30],
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result).toBe(3050);
    // The pre-PFA-175 model — (1750 / 4) × 30 — multiplied the fixed charges by
    // the days left and landed at 13125.
    expect(result).toBeLessThan(13125);
  });

  it("projects nothing when the chain has no reference period", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      dailyActuals: [1750],
      projection: { source: "none", referenceMonth: null, dailyTotals: [] },
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result).toBeNull();
  });

  it("projects nothing while the reference is still loading", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      dailyActuals: [1750],
      projection: undefined,
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result).toBeNull();
  });

  it("projects nothing when a source is named but carries no days", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1750,
      dailyActuals: [1750],
      projection: reference([]),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    expect(result).toBeNull();
  });

  it("returns the realized total on the month's last day", () => {
    const lastDay = new Date(2026, 8, 30);
    const result = endOfMonthProjection({
      monthlyTotal: 2400,
      dailyActuals: flat(30, 80),
      projection: reference(flat(30, 50)),
      monthRef: lastDay,
      now: lastDay,
    });
    expect(result).toBe(2400);
  });

  it("returns the realized total for a finished month", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 2400,
      dailyActuals: flat(31, 80),
      projection: undefined,
      monthRef: new Date(2026, 7, 15),
      now: SEPT_4,
    });
    expect(result).toBe(2400);
  });

  it("projects nothing for a month that has not started", () => {
    const result = endOfMonthProjection({
      monthlyTotal: 1600,
      dailyActuals: [],
      projection: undefined,
      monthRef: new Date(2026, 9, 15),
      now: SEPT_4,
    });
    expect(result).toBeNull();
  });

  it("carries the reference month's last day forward when it is shorter", () => {
    // March (31 days) projected from February (28): days 29, 30 and 31 have no
    // counterpart and repeat February 28th.
    const february = [...flat(27, 10), 100];
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      dailyActuals: [],
      projection: reference(february),
      monthRef: new Date(2026, 2, 27),
      now: new Date(2026, 2, 27),
    });
    expect(result).toBe(400); // day 28 (100) + days 29–31 carrying it forward
  });

  it("ignores the reference month's overhanging days when it is longer", () => {
    // February (28 days) projected from January (31): only day 28 is left, and
    // January's days 29–31 are never read.
    const result = endOfMonthProjection({
      monthlyTotal: 0,
      dailyActuals: [],
      projection: reference(flat(31, 10)),
      monthRef: new Date(2026, 1, 27),
      now: new Date(2026, 1, 27),
    });
    expect(result).toBe(10);
  });

  it("never counts a spending dated ahead twice", () => {
    // A 200 entry booked on the 20th is already inside monthlyTotal. Estimating
    // that day from the reference on top of it would inflate the figure.
    const dailyActuals = [40, 30, 50, 30];
    dailyActuals[19] = 200;
    const result = endOfMonthProjection({
      monthlyTotal: 1950, // 1600 fixed + 150 spent + the 200 booked ahead
      dailyActuals,
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // 25 estimated days at 50, and nothing added for the 20th.
    expect(result).toBe(1950 + 1250);
  });

  it("tops a booked day up to the reference when the estimate is the larger of the two", () => {
    const dailyActuals = [40, 30, 50, 30];
    dailyActuals[19] = 20; // day 20 already carries 20, the reference expects 50
    const result = endOfMonthProjection({
      monthlyTotal: 1770,
      dailyActuals,
      projection: reference(flat(30, 50)),
      monthRef: SEPT_4,
      now: SEPT_4,
    });
    // 25 full days at 50, plus the 30 still expected on the 20th.
    expect(result).toBe(1770 + 1250 + 30);
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
