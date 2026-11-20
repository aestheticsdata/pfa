import { dailyBuckets, PROJECTION_SOURCE, projectionCandidates } from "@contexts/analytics/domain/projection";
import { CalendarMonth } from "@shared-kernel/calendar-month";

describe("projectionCandidates (COS-27)", () => {
  it("tries N-1, then N-2, then the previous month — never an average", () => {
    const chain = projectionCandidates(CalendarMonth.of(2026, 10));
    expect(chain.map((c) => [c.source, c.month.firstDayIso()])).toEqual([
      [PROJECTION_SOURCE.sameMonthLastYear, "2025-11-01"],
      [PROJECTION_SOURCE.sameMonthTwoYearsAgo, "2024-11-01"],
      [PROJECTION_SOURCE.previousMonth, "2026-10-01"],
    ]);
  });

  it("takes January's previous month from the year before", () => {
    expect(projectionCandidates(CalendarMonth.of(2026, 0))[2].month.firstDayIso()).toBe("2025-12-01");
  });
});

describe("dailyBuckets (PFA-181)", () => {
  it("buckets by day, as a whole and per category, slices adding back up", () => {
    const month = CalendarMonth.of(2026, 1);
    const day = (d: number) => new Date(Date.UTC(2026, 1, d));
    const buckets = dailyBuckets(
      [
        { date: day(1), amount: 10, categoryId: "food" },
        { date: day(1), amount: 5, categoryId: null },
        { date: day(28), amount: 2.5, categoryId: "food" },
      ],
      month,
    );

    expect(buckets.dailyTotals).toHaveLength(28);
    expect([buckets.dailyTotals[0], buckets.dailyTotals[27]]).toEqual([15, 2.5]);
    expect(buckets.byCategoryId.get("food")?.[27]).toBe(2.5);
    const sliced = [...buckets.byCategoryId.values()].reduce((sum, daily) => sum + daily.reduce((a, b) => a + b, 0), 0);
    expect(sliced).toBe(17.5);
  });
});
