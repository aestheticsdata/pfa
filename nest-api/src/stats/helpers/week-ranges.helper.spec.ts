import { makeRange, weekRangesOfMonth } from "@stats/helpers/week-ranges.helper";

describe("weekRangesOfMonth", () => {
  it("slices a month into Sun→Sat ranges truncated at its edges", () => {
    // June 2026 starts on a Monday.
    expect(weekRangesOfMonth(2026, 5)).toEqual([
      { startDay: 1, endDay: 6 },
      { startDay: 7, endDay: 13 },
      { startDay: 14, endDay: 20 },
      { startDay: 21, endDay: 27 },
      { startDay: 28, endDay: 30 },
    ]);
  });

  it("yields full weeks only when the month starts on a Sunday and ends on a Saturday", () => {
    // February 2026 starts on a Sunday and has 28 days.
    expect(weekRangesOfMonth(2026, 1)).toEqual([
      { startDay: 1, endDay: 7 },
      { startDay: 8, endDay: 14 },
      { startDay: 15, endDay: 21 },
      { startDay: 22, endDay: 28 },
    ]);
  });
});

describe("makeRange", () => {
  const spending = (day: number, amount: number) => ({
    date: new Date(2026, 5, day),
    amount: { toString: () => String(amount) },
  });

  it("totals each week slice of the month, empty weeks at 0", () => {
    const totals = makeRange(
      [spending(3, 10.4), spending(6, 5), spending(7, 20), spending(30, 3.6)],
      new Date(2026, 5, 1),
    );

    expect(totals).toEqual([15, 20, 0, 0, 4]);
  });
});
