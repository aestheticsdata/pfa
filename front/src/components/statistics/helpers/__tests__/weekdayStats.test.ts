import { weekdayAverages } from "@components/statistics/helpers/weekdayStats";

import type { DailyStat } from "@src/schemas/stats";

const day = (date: string, total: number, count: number): DailyStat => ({ date, total, count });

describe("weekdayAverages", () => {
  // Current year, only Jan 1–8 realized. Jan 1 2023 is a Sunday, so the window
  // covers each weekday once and Sunday twice — a small, deterministic base.
  const now = new Date(2023, 0, 8);
  const days = [
    day("2023-01-02", 100, 2), // Monday
    day("2023-01-01", 10, 1), // Sunday
    day("2023-01-08", 30, 1), // Sunday
    day("2023-06-01", 999, 9), // future (excluded)
  ];

  it("averages amount and tx per weekday over the weekday's real occurrences", () => {
    const result = weekdayAverages(days, 2023, now);
    expect(result[0]).toEqual({ avgAmount: 100, avgTx: 2 }); // Monday: 100 over 1 occurrence
    expect(result[6]).toEqual({ avgAmount: 20, avgTx: 1 }); // Sunday: (10+30)/2, (1+1)/2
    expect(result[1]).toEqual({ avgAmount: 0, avgTx: 0 }); // Tuesday: no spending
  });

  it("excludes future-dated spendings from the averages", () => {
    const result = weekdayAverages(days, 2023, now);
    // 2023-06-01 (Thursday, index 3) is in the future → must not inflate Thursday.
    expect(result[3]).toEqual({ avgAmount: 0, avgTx: 0 });
  });

  it("returns zeros for every weekday when there is no spending", () => {
    const result = weekdayAverages([], 2023, new Date(2023, 5, 1));
    expect(result).toHaveLength(7);
    expect(result.every((s) => s.avgAmount === 0 && s.avgTx === 0)).toBe(true);
  });
});
