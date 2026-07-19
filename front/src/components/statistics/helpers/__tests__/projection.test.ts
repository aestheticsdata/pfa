import { projectedRemainingRegular } from "@components/statistics/helpers/projection";

import type { YearMonthly } from "@components/statistics/helpers/projection";

const ym = (totals: number[], present: boolean[]): YearMonthly => ({ totals, present });
const zeros = Array<number>(12).fill(0);
const allFalse = Array<boolean>(12).fill(false);
const allTrue = Array<boolean>(12).fill(true);
const empty = ym(zeros, allFalse);

// Distinct per-month values so an index bug can't hide: Jan=10 … Dec=120.
const rising = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

describe("projectedRemainingRegular", () => {
  // 19 July 2026: 12 of the month's 31 days remain → the in-progress month is
  // prorated at 12/31.
  const midJuly = new Date(2026, 6, 19);
  const julyShare = 12 / 31;

  it("estimates the rest of the year from the same months last year (N-1)", () => {
    const result = projectedRemainingRegular(empty, ym(rising, allTrue), empty, midJuly);
    // July remainder (70 × 12/31) + Aug…Dec in full (80+90+100+110+120).
    expect(result).toBeCloseTo(500 + 70 * julyShare, 6);
  });

  it("falls back to two years ago (N-2) for a month N-1 is missing", () => {
    const lastYear = ym(
      rising,
      allTrue.map((_, i) => i !== 8),
    ); // September absent in N-1
    const twoAgo = ym(
      [...zeros].map((_, i) => (i === 8 ? 999 : 0)),
      allTrue.map((_, i) => i === 8),
    );
    const result = projectedRemainingRegular(empty, lastYear, twoAgo, midJuly);
    // Aug 80 + Sep 999 (from N-2) + Oct 100 + Nov 110 + Dec 120 = 1409.
    expect(result).toBeCloseTo(1409 + 70 * julyShare, 6);
  });

  it("falls back to the previous month (M-1) when there is no prior year", () => {
    const current = ym(
      [...zeros].map((_, i) => (i === 5 ? 600 : 0)),
      allTrue.map((_, i) => i === 5),
    ); // June only
    const result = projectedRemainingRegular(current, empty, empty, midJuly);
    // Every remaining month uses June's 600: Aug…Dec (×5) + July remainder.
    expect(result).toBeCloseTo(3000 + 600 * julyShare, 6);
  });

  it("returns null at the very first month of data (no reference at all)", () => {
    const current = ym(
      zeros,
      allTrue.map((_, i) => i === 6),
    ); // July only, no earlier month
    const result = projectedRemainingRegular(current, empty, empty, midJuly);
    expect(result).toBeNull();
  });

  it("only prorates the in-progress month when it is the last of the year", () => {
    const midDecember = new Date(2026, 11, 15); // 16 of 31 days remain
    const result = projectedRemainingRegular(empty, ym(rising, allTrue), empty, midDecember);
    expect(result).toBeCloseTo(120 * (16 / 31), 6);
  });

  it("uses presence, not value: a real zero-spend reference month counts", () => {
    const midDecember = new Date(2026, 11, 15);
    const lastYear = ym(
      zeros,
      allTrue.map((_, i) => i === 11),
    ); // Dec present but 0
    const twoAgo = ym(
      [...zeros].map((_, i) => (i === 11 ? 999 : 0)),
      allTrue.map((_, i) => i === 11),
    );
    const result = projectedRemainingRegular(empty, lastYear, twoAgo, midDecember);
    // N-1's real 0 wins over N-2's 999 → the December remainder is 0, not null.
    expect(result).toBe(0);
  });
});
