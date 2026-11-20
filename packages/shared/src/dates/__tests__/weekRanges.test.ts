import { describe, expect, it } from "vitest";
import { weekLengths, weekSliceOf, weekSlices } from "#dates/weekRanges";

// Months built at noon, local time: the week model is calendar-based, never a UTC instant.
const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe("weekLengths", () => {
  it("truncates the first and last week to the month (June 2026 starts on a Monday)", () => {
    expect(weekLengths(day("2026-06-15"))).toEqual([6, 7, 7, 7, 3]);
  });

  it("has no trailing stub when the month ends on a Saturday (October 2026)", () => {
    expect(weekLengths(day("2026-10-01"))).toEqual([3, 7, 7, 7, 7]);
  });

  it("starts with a full week when the month starts on a Sunday (November 2026)", () => {
    expect(weekLengths(day("2026-11-20"))).toEqual([7, 7, 7, 7, 2]);
  });

  it("covers February in a non-leap year", () => {
    const lengths = weekLengths(day("2027-02-10"));
    expect(lengths.reduce((sum, length) => sum + length, 0)).toBe(28);
  });
});

describe("weekSlices", () => {
  it("turns the lengths into inclusive day-of-month bounds", () => {
    expect(weekSlices(day("2026-06-01"))).toEqual([
      { start: 1, end: 6 },
      { start: 7, end: 13 },
      { start: 14, end: 20 },
      { start: 21, end: 27 },
      { start: 28, end: 30 },
    ]);
  });
});

describe("weekSliceOf", () => {
  it("finds the week a day falls in", () => {
    const slices = weekSlices(day("2026-06-01"));
    expect(weekSliceOf(slices, day("2026-06-06"))).toEqual({ start: 1, end: 6 });
    expect(weekSliceOf(slices, day("2026-06-07"))).toEqual({ start: 7, end: 13 });
    expect(weekSliceOf(slices, day("2026-06-30"))).toEqual({ start: 28, end: 30 });
  });
});
