import {
  categoryMonthly,
  filledMonthlyIncome,
  monthlyPresence,
  monthlyTotals,
  perCategoryTotals,
} from "@components/statistics/helpers/statisticsData";

import type { StatisticsResponse } from "@src/schemas/stats";

const data: StatisticsResponse["data"] = {
  "2026": [
    { month: "janv.", totals: { food: 10, rent: 5 } },
    { month: "mars", totals: { food: 0 } }, // present, but a genuine zero total
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

// These two read every per-category total on a row. They had no coverage while
// the row was still a flat map keyed by category name with the month label mixed
// in, so the split into { month, totals } (COS-109) is pinned down here.
describe("perCategoryTotals", () => {
  const colors = { food: "#111", rent: "#222" };

  it("sums each category across the year's months, sorted descending", () => {
    expect(perCategoryTotals(data, colors, 2026)).toEqual([
      { name: "food", value: 10, color: "#111" },
      { name: "rent", value: 5, color: "#222" },
    ]);
  });

  it("never counts the month label as a category", () => {
    expect(perCategoryTotals(data, colors, 2026).map((c) => c.name)).not.toContain("month");
  });

  it("falls back to the placeholder colour for an unknown category", () => {
    const [food] = perCategoryTotals(data, {}, 2026);
    expect(food.color).toBeTruthy();
    expect(food.color).not.toBe("#111");
  });

  it("returns nothing for a year with no data", () => {
    expect(perCategoryTotals(data, colors, 2020)).toEqual([]);
  });
});

describe("categoryMonthly", () => {
  it("places each month's value at its calendar index", () => {
    const series = categoryMonthly(data, 2026, "food");
    expect(series[0]).toBe(10); // janv.
    expect(series[2]).toBe(0); // mars — a real zero
    expect(series).toHaveLength(12);
  });

  it("yields 0 for a month where the category is absent", () => {
    // "rent" only appears in janv., so mars must read 0 rather than undefined.
    expect(categoryMonthly(data, 2026, "rent")[2]).toBe(0);
  });

  it("yields an all-zero series for an unknown category", () => {
    expect(categoryMonthly(data, 2026, "nope")).toEqual(Array(12).fill(0));
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
