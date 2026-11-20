import { CalendarMonth } from "@shared-kernel/calendar-month";

describe("CalendarMonth", () => {
  it("wraps January back to the previous December", () => {
    const december = CalendarMonth.of(2026, 0).plusMonths(-1);
    expect([december.year, december.month]).toEqual([2025, 11]);
  });

  it("bounds a month as a half-open UTC range", () => {
    const february = CalendarMonth.of(2028, 1);
    expect(february.start().toISOString()).toBe("2028-02-01T00:00:00.000Z");
    expect(february.end().toISOString()).toBe("2028-03-01T00:00:00.000Z");
    expect(february.daysIn()).toBe(29);
  });

  it("reads the month of a date in UTC", () => {
    const month = CalendarMonth.containing(new Date("2026-11-30T23:59:59.000Z"));
    expect(month.firstDayIso()).toBe("2026-11-01");
    expect(month.plusYears(-2).firstDayIso()).toBe("2024-11-01");
  });
});
