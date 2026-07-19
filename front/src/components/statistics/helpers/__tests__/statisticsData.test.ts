import { filledMonthlyIncome, monthlyPresence, monthlyTotals } from "@components/statistics/helpers/statisticsData";

import type { StatisticsResponse } from "@src/schemas/stats";

const data: StatisticsResponse["data"] = {
  "2026": [
    { month: "janv.", food: 10, rent: 5 },
    { month: "mars", food: 0 }, // present, but a genuine zero total
  ],
};

describe("monthlyPresence", () => {
  it("flags only the months the year actually has a row for", () => {
    const present = monthlyPresence(data, 2026);
    expect(present[0]).toBe(true); // janv.
    expect(present[2]).toBe(true); // mars — present even though its total is 0
    expect(present[1]).toBe(false); // févr. — no row
    expect(present.filter(Boolean)).toHaveLength(2);
  });

  it("tells a real zero-spend month apart from a no-data month", () => {
    const totals = monthlyPresence(data, 2026);
    // March totals to 0 but is present; February is simply absent.
    expect(monthlyTotals(data, 2026)[2]).toBe(0);
    expect(totals[2]).toBe(true);
    expect(totals[1]).toBe(false);
  });

  it("returns an all-false mask for a year with no data", () => {
    expect(monthlyPresence(data, 2020)).toEqual(Array(12).fill(false));
  });
});

describe("filledMonthlyIncome", () => {
  const sparse = (entries: Record<number, number>): (number | null)[] =>
    Array.from({ length: 12 }, (_, i) => entries[i] ?? null);

  it("carries the last known income forward over the gaps", () => {
    const result = filledMonthlyIncome(sparse({ 0: 3000, 3: 3200, 10: 3500 }));
    expect(result).toEqual([3000, 3000, 3000, 3200, 3200, 3200, 3200, 3200, 3200, 3200, 3500, 3500]);
  });

  it("back-fills the leading months before the first known value", () => {
    const result = filledMonthlyIncome(sparse({ 5: 2000 }));
    expect(result).toEqual(Array(12).fill(2000));
  });

  it("preserves a real zero income", () => {
    const result = filledMonthlyIncome(sparse({ 0: 3000, 6: 0 }));
    expect(result?.[6]).toBe(0);
    expect(result?.[11]).toBe(0); // carried forward from the zero
  });

  it("returns null when there is no income at all", () => {
    expect(filledMonthlyIncome(Array(12).fill(null))).toBeNull();
    expect(filledMonthlyIncome([])).toBeNull();
  });
});
