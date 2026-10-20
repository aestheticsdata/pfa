import { dayOfWeekScale, deltaPct } from "@components/statistics/dayOfWeek/helpers/dayOfWeekScale";
import { describe, expect, it } from "vitest";

import type { WeekdayStat } from "@components/statistics/interfaces/weekdayStatsTypes";

const stat = (avgAmount: number, p90 = avgAmount): WeekdayStat =>
  ({ avgAmount, avgTx: 1, p10: 0, p90, min: 0, max: p90 }) as WeekdayStat;

describe("deltaPct", () => {
  it("is the signed % of value over base, null without a base", () => {
    expect(deltaPct(120, 100)).toBeCloseTo(20);
    expect(deltaPct(80, 100)).toBeCloseTo(-20);
    expect(deltaPct(10, 0)).toBeNull();
  });
});

describe("dayOfWeekScale", () => {
  it("scales on the highest p90 plus headroom when there is no ceiling", () => {
    const scale = dayOfWeekScale({
      stats: [stat(20, 50), stat(30, 40)],
      compareStats: null,
      overallAvg: 25,
      weeklyCeiling: null,
    });
    expect(scale.dayBudget).toBeNull();
    expect(scale.budgetFrac).toBeNull();
    expect(scale.scaleMax).toBeCloseTo(50 * 1.12);
    expect(scale.avgFrac).toBeCloseTo(25 / (50 * 1.12));
    expect(scale.avgLabelAlign).toBe("-translate-x-1/2");
  });

  it("reaches twice the day budget so the red zone fits, and places both thresholds", () => {
    const scale = dayOfWeekScale({ stats: [stat(10)], compareStats: [stat(12)], overallAvg: 10, weeklyCeiling: 140 });
    expect(scale.dayBudget).toBe(20);
    expect(scale.dangerBudget).toBe(40);
    expect(scale.scaleMax).toBeCloseTo(40 * 1.12);
    expect(scale.budgetFrac).toBeCloseTo(20 / (40 * 1.12));
    expect(scale.dangerFrac).toBeCloseTo(40 / (40 * 1.12));
  });

  it("anchors the average label flush when the line sits near an edge", () => {
    const low = dayOfWeekScale({ stats: [stat(100)], compareStats: null, overallAvg: 5, weeklyCeiling: null });
    const high = dayOfWeekScale({ stats: [stat(100)], compareStats: null, overallAvg: 100, weeklyCeiling: null });
    expect(low.avgLabelAlign).toBe("translate-x-0");
    expect(high.avgLabelAlign).toBe("-translate-x-full");
  });
});
