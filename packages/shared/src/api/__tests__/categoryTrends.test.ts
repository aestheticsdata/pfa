import { describe, expect, it } from "vitest";
import { aggregateTrendsByCategory } from "#api/fetchers/categoryTrends";

import type { CategoryTrendPoint } from "#schemas/stats";

const point = (category: string | null, value: number, previousValue: number | null): CategoryTrendPoint =>
  ({ category, value, previousValue }) as CategoryTrendPoint;

describe("aggregateTrendsByCategory", () => {
  it("merges a user category and a global one that share a name, then sorts by amount", () => {
    const merged = aggregateTrendsByCategory([
      point("Courses", 40, 30),
      point("Sport", 90, null),
      point("Courses", 60, 10),
    ]);

    expect(merged.map(({ category, value, previousValue }) => ({ category, value, previousValue }))).toEqual([
      { category: "Courses", value: 100, previousValue: 40 },
      { category: "Sport", value: 90, previousValue: null },
    ]);
  });

  it("keeps a category new when none of its rows had a previous value", () => {
    const [merged] = aggregateTrendsByCategory([point("Loisirs", 5, null), point("Loisirs", 5, null)]);
    expect(merged?.previousValue).toBeNull();
  });

  it("does not mutate the rows it was given", () => {
    const rows = [point("Courses", 1, 1), point("Courses", 2, 2)];
    aggregateTrendsByCategory(rows);
    expect(rows[0]?.value).toBe(1);
  });
});
