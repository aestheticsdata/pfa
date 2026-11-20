import { CalendarDay } from "@shared-kernel/calendar-day";

describe("CalendarDay", () => {
  it("keeps the date part of a timestamp", () => {
    expect(CalendarDay.of("2026-11-20T23:30:00.000Z").iso).toBe("2026-11-20");
  });

  it("reads a @db.Date value in UTC", () => {
    expect(CalendarDay.fromDate(new Date("2026-03-01T00:00:00.000Z")).iso).toBe("2026-03-01");
  });

  it("compares days, not instants", () => {
    expect(CalendarDay.of("2026-11-20").equals(CalendarDay.of("2026-11-20T08:00:00Z"))).toBe(true);
    expect(CalendarDay.of("2026-11-20").equals(CalendarDay.of("2026-11-21"))).toBe(false);
  });

  it("writes the UTC midnight of its day", () => {
    expect(CalendarDay.of("2026-11-20").toDate().toISOString()).toBe("2026-11-20T00:00:00.000Z");
  });

  it("refuses what is not a date", () => {
    expect(() => CalendarDay.of("20/11/2026")).toThrow("Invalid date: 20/11/2026");
  });
});
