import {
  overallDailyAverage,
  percentile,
  weekdayAverages,
  weekdayInsights,
} from "@components/statistics/helpers/weekdayStats";

import type { WeekdayStat } from "@components/statistics/helpers/weekdayStats";
import type { DailyStat } from "@src/schemas/stats";

const day = (date: string, total: number, count: number): DailyStat => ({ date, total, count });

/** Local calendar date as YYYY-MM-DD, matching the API's day keys. */
const iso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

describe("percentile", () => {
  it("returns 0 for an empty series", () => {
    expect(percentile([], 0.1)).toBe(0);
    expect(percentile([], 0.9)).toBe(0);
  });

  it("returns the only value of a single-value series", () => {
    expect(percentile([42], 0.1)).toBe(42);
    expect(percentile([42], 0.9)).toBe(42);
  });

  it("interpolates linearly between the surrounding values", () => {
    // Two values: p10 sits a tenth of the way from 10 to 30, p90 nine tenths.
    expect(percentile([10, 30], 0.1)).toBeCloseTo(12, 10);
    expect(percentile([10, 30], 0.9)).toBeCloseTo(28, 10);
    // Exact positions need no interpolation.
    expect(percentile([0, 10, 20, 30, 40], 0.5)).toBe(20);
  });

  it("clamps the fraction to the series bounds", () => {
    expect(percentile([5, 10, 15], -1)).toBe(5);
    expect(percentile([5, 10, 15], 2)).toBe(15);
  });
});

describe("weekdayAverages", () => {
  // Current year, only Jan 1–8 realized. Jan 1 2023 is a Sunday, so the window
  // covers each weekday once and Sunday twice — a small, deterministic base.
  const now = new Date(2023, 0, 8);
  const days = [
    day("2023-01-02", 100, 2), // Monday
    day("2023-01-01", 10, 1), // Sunday
    day("2023-01-08", 30, 1), // Sunday
    day("2023-06-01", 999, 9), // future (excluded)
  ];

  it("averages amount and tx per weekday over the weekday's real occurrences", () => {
    const result = weekdayAverages(days, 2023, now);
    // Monday: 100 over 1 occurrence — a one-value series, so every percentile is 100.
    expect(result[0]).toEqual({ avgAmount: 100, avgTx: 2, min: 100, max: 100, p10: 100, p90: 100 });
    // Sunday: (10+30)/2, (1+1)/2, extremes 10–30, typical range interpolated between them.
    expect(result[6]).toEqual({ avgAmount: 20, avgTx: 1, min: 10, max: 30, p10: 12, p90: 28 });
    // Tuesday: no spending at all.
    expect(result[1]).toEqual({ avgAmount: 0, avgTx: 0, min: 0, max: 0, p10: 0, p90: 0 });
  });

  it("ranges min/max over that weekday's spending days only (not zero-spend occurrences)", () => {
    // Sunday has two spending days (10 and 30) among more Sunday occurrences; the
    // extremes span the actual spend, not a 0 floor.
    const result = weekdayAverages(days, 2023, now);
    expect(result[6].min).toBe(10);
    expect(result[6].max).toBe(30);
  });

  it("counts realized zero-spend days in the typical range", () => {
    // Five Sundays realized (Jan 1, 8, 15, 22, 29), only two with spending: the
    // percentile series is [0, 0, 0, 100, 200], same population as the average.
    const sundays = [day("2023-01-01", 100, 1), day("2023-01-08", 200, 1)];
    const result = weekdayAverages(sundays, 2023, new Date(2023, 0, 29));
    expect(result[6].p10).toBe(0); // three empty Sundays sit at the bottom of the series
    expect(result[6].p90).toBeCloseTo(160, 10); // 100 + (200 − 100) × 0.6
    expect(result[6].min).toBe(100); // extremes still ignore the empty days
    expect(result[6].max).toBe(200);
  });

  it("keeps the typical range clear of a single outlier day", () => {
    // 52 Mondays of 2022 at 50 € each, except one 5 000 € day: p90 stays at the
    // usual level while max follows the outlier — this is what keeps the chart's
    // scale (built on p90) readable on a real account.
    const mondays = Array.from({ length: 52 }, (_, week) =>
      day(iso(new Date(2022, 0, 3 + week * 7)), week === 0 ? 5000 : 50, 1),
    );
    const result = weekdayAverages(mondays, 2022, new Date(2023, 0, 8));
    expect(result[0].p90).toBe(50);
    expect(result[0].max).toBe(5000);
  });

  it("excludes future-dated spendings from the averages", () => {
    const result = weekdayAverages(days, 2023, now);
    // 2023-06-01 (Thursday, index 3) is in the future → must not inflate Thursday.
    expect(result[3]).toEqual({ avgAmount: 0, avgTx: 0, min: 0, max: 0, p10: 0, p90: 0 });
  });

  it("returns zeros for every weekday when there is no spending", () => {
    const result = weekdayAverages([], 2023, new Date(2023, 5, 1));
    expect(result).toHaveLength(7);
    expect(result.every((s) => s.avgAmount === 0 && s.avgTx === 0)).toBe(true);
  });
});

describe("overallDailyAverage", () => {
  const now = new Date(2023, 0, 8); // Jan 1–8 realized → 8 elapsed days
  const days = [
    day("2023-01-02", 100, 2),
    day("2023-01-01", 10, 1),
    day("2023-01-08", 30, 1),
    day("2023-06-01", 999, 9), // future (excluded)
  ];

  it("divides realized spend and tx by the elapsed-day count", () => {
    // (100+10+30)=140 € over 8 realized days; (2+1+1)=4 tx over 8 days.
    expect(overallDailyAverage(days, 2023, now)).toEqual({ avgAmount: 140 / 8, avgTx: 4 / 8 });
  });

  it("excludes future-dated spendings", () => {
    const withoutFuture = days.filter((d) => d.date !== "2023-06-01");
    expect(overallDailyAverage(days, 2023, now)).toEqual(overallDailyAverage(withoutFuture, 2023, now));
  });

  it("returns zeros when there is no realized spending", () => {
    expect(overallDailyAverage([], 2023, new Date(2023, 5, 1))).toEqual({ avgAmount: 0, avgTx: 0 });
  });

  it("weights a completed past year over its full 365 days", () => {
    // 2022 is fully realized and not a leap year: one 50 €/3-tx day ÷ 365 days.
    const oneDay = [day("2022-03-15", 50, 3)];
    expect(overallDailyAverage(oneDay, 2022, now)).toEqual({ avgAmount: 50 / 365, avgTx: 3 / 365 });
  });
});

describe("weekdayInsights", () => {
  const s = (avgAmount: number): WeekdayStat => ({ avgAmount, avgTx: 0, min: 0, max: 0, p10: 0, p90: 0 });

  it("flags the priciest and cheapest weekdays and the weekend delta", () => {
    // Mon40 Tue40 Wed80 Thu20 Fri40 Sat60 Sun60
    const stats = [40, 40, 80, 20, 40, 60, 60].map(s);
    const { peakDow, troughDow, weekendDeltaPct } = weekdayInsights(stats);
    expect(peakDow).toBe(2); // Wednesday
    expect(troughDow).toBe(3); // Thursday
    // weekday mean = (40+40+80+20+40)/5 = 44; weekend mean = (60+60)/2 = 60.
    expect(weekendDeltaPct).toBeCloseTo((60 / 44 - 1) * 100, 5);
  });

  it("ignores zero-spend weekdays when picking the trough", () => {
    // Tuesday has no spending (0) — it must not be flagged as the trough.
    const stats = [40, 0, 80, 30, 40, 60, 60].map(s);
    expect(weekdayInsights(stats).troughDow).toBe(3); // Thursday (30), not Tuesday (0)
  });

  it("returns nulls when no weekday has spending", () => {
    const stats = Array.from({ length: 7 }, () => s(0));
    expect(weekdayInsights(stats)).toEqual({ peakDow: null, troughDow: null, weekendDeltaPct: null });
  });
});
