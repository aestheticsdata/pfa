import { PACE_MIN_DAYS, spendingPaceDelta } from "@components/spendings/helpers/spendingPace";

import type { MonthlyTotal } from "@src/schemas/stats";

// May 2026 = 31 days, April = 30, March = 31. Totals are chosen so each month's
// daily rate is exact (total ÷ days) — a rate of 10/day is 310 in May, 300 in
// April, 310 in March. Current-month inputs use 30 elapsed days (≥ PACE_MIN_DAYS)
// so `monthlyTotal / elapsedDays` is the intended daily rate.
const month = (m: string, total: number): MonthlyTotal => ({ month: m, total });
const flatTen = [month("2026-05-01", 310), month("2026-04-01", 300), month("2026-03-01", 310)];
const atRate = (rate: number) => rate * 30; // monthlyTotal for a given daily rate over 30 elapsed days

describe("spendingPaceDelta", () => {
  it("reports the current month as slower when its daily rate is below the 3-month average", () => {
    const result = spendingPaceDelta(atRate(8), 30, flatTen);
    expect(result?.faster).toBe(false);
    expect(result?.deltaPct).toBeCloseTo(-20, 6); // (8 − 10) / 10
  });

  it("reports faster when the current daily rate is above the average", () => {
    const result = spendingPaceDelta(atRate(12), 30, flatTen);
    expect(result?.faster).toBe(true);
    expect(result?.deltaPct).toBeCloseTo(20, 6);
  });

  it("normalizes each month by its own length, not by its raw total", () => {
    // Both months spend at 10/day despite different totals (May 31d, April 30d).
    const result = spendingPaceDelta(atRate(10), 30, [month("2026-05-01", 310), month("2026-04-01", 300)]);
    expect(result?.deltaPct).toBeCloseTo(0, 6);
  });

  it("averages the kept months' rates equally", () => {
    // May 620 → 20/day, April 300 → 10/day → average 15/day.
    const result = spendingPaceDelta(atRate(15), 30, [month("2026-05-01", 620), month("2026-04-01", 300)]);
    expect(result?.deltaPct).toBeCloseTo(0, 6);
  });

  it("excludes empty months instead of averaging in a zero", () => {
    // Only May (10/day) counts; a naive (10+0+0)/3 average would flip the sign.
    const result = spendingPaceDelta(atRate(5), 30, [
      month("2026-05-01", 310),
      month("2026-04-01", 0),
      month("2026-03-01", 0),
    ]);
    expect(result?.deltaPct).toBeCloseTo(-50, 6);
  });

  it("returns null when no prior month has spending", () => {
    expect(spendingPaceDelta(atRate(10), 30, [])).toBeNull();
    expect(spendingPaceDelta(atRate(10), 30, [month("2026-05-01", 0), month("2026-04-01", 0)])).toBeNull();
  });

  it("returns null before enough of the month has elapsed, even with a baseline", () => {
    expect(spendingPaceDelta(atRate(10), PACE_MIN_DAYS - 1, flatTen)).toBeNull();
  });

  it("computes as soon as PACE_MIN_DAYS have elapsed", () => {
    // 70 over 7 days = 10/day, matching the baseline → 0% gap (not null).
    const result = spendingPaceDelta(10 * PACE_MIN_DAYS, PACE_MIN_DAYS, flatTen);
    expect(result?.deltaPct).toBeCloseTo(0, 6);
  });
});
