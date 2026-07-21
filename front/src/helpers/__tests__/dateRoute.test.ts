import { formatMonthParam, parseAsSpendingsDate, parseMonthParam, resolveMonthParam } from "@helpers/dateRoute";
import { describe, expect, it } from "vitest";

describe("formatMonthParam / parseMonthParam", () => {
  it("formats a date as YYYY-MM on the local calendar", () => {
    expect(formatMonthParam(new Date(2026, 6, 1))).toBe("2026-07");
    expect(formatMonthParam(new Date(2025, 0, 15))).toBe("2025-01");
  });

  it("round-trips through parse to the first day of the month", () => {
    const parsed = parseMonthParam("2024-03");
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(2); // March
    expect(parsed.getDate()).toBe(1);
    expect(formatMonthParam(parsed)).toBe("2024-03");
  });
});

describe("resolveMonthParam", () => {
  const currentMonthStart = new Date(2026, 6, 1); // July 2026

  it("returns null when the target resolves to the current month", () => {
    expect(resolveMonthParam(new Date(2026, 6, 1), currentMonthStart)).toBeNull();
    // Any day within the current month collapses to the same month → still null.
    expect(resolveMonthParam(new Date(2026, 6, 28), currentMonthStart)).toBeNull();
  });

  it("returns the YYYY-MM of any other month", () => {
    expect(resolveMonthParam(new Date(2025, 8, 10), currentMonthStart)).toBe("2025-09");
    expect(resolveMonthParam(new Date(2027, 0, 1), currentMonthStart)).toBe("2027-01");
  });
});

describe("parseAsSpendingsDate", () => {
  it("keeps a valid ISO calendar day as a plain local string (never a Date)", () => {
    const parsed = parseAsSpendingsDate.parse("2026-07-12");
    expect(parsed).toBe("2026-07-12");
    expect(typeof parsed).toBe("string");
  });

  it("rejects malformed or out-of-range values to null (page falls back to today)", () => {
    expect(parseAsSpendingsDate.parse("")).toBeNull();
    expect(parseAsSpendingsDate.parse("2026-7-2")).toBeNull();
    expect(parseAsSpendingsDate.parse("20260712")).toBeNull();
    expect(parseAsSpendingsDate.parse("not-a-date")).toBeNull();
    expect(parseAsSpendingsDate.parse("2026-13-01")).toBeNull();
  });

  it("serializes back to the untouched ISO string", () => {
    expect(parseAsSpendingsDate.serialize("2026-07-12")).toBe("2026-07-12");
  });
});
