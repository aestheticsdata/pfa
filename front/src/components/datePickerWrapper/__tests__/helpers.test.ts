import { getWeekRange, parseDateParam } from "@components/datePickerWrapper/helpers";
import format from "date-fns/format";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The Spendings week bug (COS-73) only surfaces in timezones WEST of UTC, where
// `new Date("2026-07-12")` (parsed as UTC midnight) rolls back to the previous
// local day. Force such a timezone so the regression is caught regardless of the
// CI machine's timezone. Node honours runtime `process.env.TZ` changes.
const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/New_York";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

const iso = (date: Date) => format(date, "yyyy-MM-dd");

describe("parseDateParam", () => {
  it("parses a date-only ISO param as a LOCAL date (no UTC day shift)", () => {
    // Sunday 12 July 2026 — must stay the 12th, a Sunday, even west of UTC.
    const date = parseDateParam("2026-07-12");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July
    expect(date.getDate()).toBe(12);
    expect(date.getDay()).toBe(0); // Sunday (week start)
  });
});

describe("getWeekRange from a date-only param", () => {
  it("returns the week CONTAINING the param date (Sun 12 → Sat 18)", () => {
    const range = getWeekRange(parseDateParam("2026-07-12"));
    expect(iso(range.from)).toBe("2026-07-12");
    expect(iso(range.to)).toBe("2026-07-18");
  });

  it("regression guard: naive `new Date(param)` yields the PREVIOUS week west of UTC", () => {
    // Documents exactly the reported bug — kept so a revert to `new Date` is
    // visibly wrong here rather than silently shipping.
    const buggy = getWeekRange(new Date("2026-07-12"));
    expect(iso(buggy.from)).toBe("2026-07-05");
    expect(iso(buggy.to)).toBe("2026-07-11");
  });
});
