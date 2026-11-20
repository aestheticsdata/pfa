import { yearSpan, yearsOf } from "@contexts/budget-planning/domain/exceptional-years";
import { budgetRevision } from "@contexts/budget-planning/domain/monthly-budget";
import { carriedForward, drawnWindow, RECURRING_ITEM_TYPE } from "@contexts/budget-planning/domain/recurring-charges";

describe("drawnWindow (déjà prélevé, COS-49)", () => {
  it("runs from January through the given month, half-open, in UTC", () => {
    expect(drawnWindow("2026", "6")).toEqual({
      from: new Date(Date.UTC(2026, 0, 1)),
      until: new Date(Date.UTC(2026, 7, 1)),
    });
  });

  it("crosses into the next year for December", () => {
    expect(drawnWindow("2026", "11")?.until).toEqual(new Date(Date.UTC(2027, 0, 1)));
  });

  it("is none for a year or a month that is not one", () => {
    expect(drawnWindow("abc", "1")).toBeNull();
    expect(drawnWindow("2026", "12")).toBeNull();
    expect(drawnWindow("2026", "-1")).toBeNull();
  });
});

describe("carriedForward", () => {
  it("dates last month's charges in the new month, category and all", () => {
    const month = { start: new Date("2026-12-01"), end: new Date("2026-12-31") };
    const [charge] = carriedForward(
      [{ label: "Rent", amount: "800.00", itemType: RECURRING_ITEM_TYPE, currency: "EUR", categoryId: "c1" }],
      month,
    );
    expect(charge).toEqual({
      label: "Rent",
      amount: "800.00",
      itemType: RECURRING_ITEM_TYPE,
      currency: "EUR",
      categoryId: "c1",
      ...month,
    });
  });
});

describe("exceptional years", () => {
  it("lists each year once, newest first", () => {
    expect(yearsOf([new Date(2024, 5, 1), new Date(2026, 1, 1), new Date(2024, 8, 1)])).toEqual([2026, 2024]);
  });

  it("spans a whole year, and nothing for no year or a bad one", () => {
    expect(yearSpan("2025")).toEqual({ gte: new Date("2025-01-01"), lte: new Date("2025-12-31") });
    expect(yearSpan(undefined)).toBeNull();
    expect(yearSpan("soon")).toBeNull();
  });
});

describe("budgetRevision", () => {
  it("writes only the fields sent", () => {
    expect(budgetRevision({ amount: 2000 })).toEqual({ initialAmount: 2000 });
    expect(budgetRevision({ ceiling: 0, amount: null })).toEqual({ initialCeiling: 0 });
  });

  it("is nothing to write when nothing is sent", () => {
    expect(budgetRevision({})).toBeNull();
  });
});
